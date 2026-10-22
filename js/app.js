/**
 * ASSIGNMENT WEB1044 - LẬP TRÌNH CƠ SỞ VỚI JAVASCRIPT
 * WEBSITE THƯƠNG MẠI ĐIỆN TỬ: VNB SHOP (CẦU LÔNG CHÍNH HÃNG)
 * GIAI ĐOẠN 1 & 2 - GIAO DIỆN HIỆN ĐẠI, CAO CẤP & ĐẦY ĐỦ TÍNH NĂNG
 */

/* ---------- HÀM TIỆN ÍCH ---------- */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const money = (n) => Number(n).toLocaleString("vi-VN") + "đ";
const imgPath = (f) => "img/" + f;

const FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#f8fafc"/><text x="150" y="155" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="sans-serif">VNB SPORTS</text></svg>',
  );

// Tự động thay thế ảnh lỗi bằng fallback SVG
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG" && e.target.src !== FALLBACK) {
      e.target.src = FALLBACK;
    }
  },
  true,
);

/* ---------- THÔNG BÁO TOAST CAO CẤP ---------- */
function toast(msg, type = "success") {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.append(t);
  }
  const icon = type === "error" ? "✕" : "✓";
  t.innerHTML = `
    <span class="toast-icon ${type}">${icon}</span>
    <span class="toast-msg">${msg}</span>
  `;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

/* ---------- QUẢN LÝ GIỎ HÀNG (localStorage THEO HƯỚNG DẪN huongdanasm2) ---------- */
// Khởi tạo mảng cart theo đúng code mẫu huongdanasm2
let cart = (function () {
  try {
    const isInit = localStorage.getItem("vnb_init");
    const raw = localStorage.getItem("cart") || localStorage.getItem("vnb_cart");
    if (raw !== null) return JSON.parse(raw) || [];
    // Chỉ nạp giỏ hàng mẫu lần đầu tiên mở trang web
    if (!isInit) {
      localStorage.setItem("vnb_init", "1");
      const initial = typeof DEFAULT_CART !== "undefined" ? DEFAULT_CART : [];
      localStorage.setItem("cart", JSON.stringify(initial));
      localStorage.setItem("vnb_cart", JSON.stringify(initial));
      return [...initial];
    }
    return [];
  } catch {
    return [];
  }
})();

// render cart items theo đúng mẫu huongdanasm2
const renderCart = () => {
  const cartItems = document.getElementById("cart-items");
  if (cartItems) {
    cartItems.innerHTML = cart
      .map((item) => {
        let product = (typeof products !== "undefined" ? products : PRODUCTS).find(
          (p) => p.id === item.id,
        );
        if (!product) return "";
        return `
        <div>${product.name}, số lượng ${item.qty}</div>
        `;
      })
      .join("");
  }
  // Nếu ở trang cart.html, vẽ bảng chi tiết
  if (typeof window.drawCartView === "function") {
    window.drawCartView();
  }
};

const Cart = {
  get() {
    try {
      const isInit = localStorage.getItem("vnb_init");
      const raw = localStorage.getItem("cart") || localStorage.getItem("vnb_cart");
      if (raw !== null) {
        cart = JSON.parse(raw) || [];
        return cart;
      }
      if (!isInit) {
        localStorage.setItem("vnb_init", "1");
        const initial = typeof DEFAULT_CART !== "undefined" ? DEFAULT_CART : [];
        this.save(initial);
        return [...initial];
      }
      cart = [];
      return [];
    } catch {
      cart = [];
      return [];
    }
  },
  save(c) {
    cart = c;
    localStorage.setItem("cart", JSON.stringify(c));
    localStorage.setItem("vnb_cart", JSON.stringify(c));
    updateCount();
    if (typeof renderCart === "function") {
      renderCart();
    }
  },
  add(id, q = 1) {
    const productID = Number(id);
    if (!productID) return;
    this.get(); // Đảm bảo nạp dữ liệu giỏ hàng mới nhất
    const addQty = Math.max(1, parseInt(q) || 1);
    let item = cart.find((i) => i.id === productID);
    if (item) {
      item.qty += addQty;
    } else {
      cart.push({
        id: productID,
        qty: addQty,
      });
    }
    this.save(cart);
    const p = (typeof products !== "undefined" ? products : PRODUCTS).find(
      (x) => x.id === productID,
    );
    const qtyText = addQty > 1 ? ` (x${addQty})` : "";
    toast(`Đã thêm "${p ? p.name : "sản phẩm"}"${qtyText} vào giỏ hàng!`);

    // Hiệu ứng nảy giỏ hàng
    const cartBtn = $(".cart-pill-btn");
    if (cartBtn) {
      cartBtn.classList.add("bounce");
      setTimeout(() => cartBtn.classList.remove("bounce"), 500);
    }
  },
  remove(id) {
    cart = cart.filter((x) => x.id !== Number(id));
    this.save(cart);
    toast("Đã xóa sản phẩm khỏi giỏ hàng.");
  },
  setQty(id, q) {
    const item = cart.find((x) => x.id === Number(id));
    if (item) {
      item.qty = Math.max(1, parseInt(q) || 1);
      this.save(cart);
    }
  },
  clear() {
    this.save([]);
    toast("Đã làm trống giỏ hàng.");
  },
  total() {
    return cart.reduce((sum, item) => {
      const p = (typeof products !== "undefined" ? products : PRODUCTS).find(
        (x) => x.id === item.id,
      );
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  },
};

function updateCount() {
  const count = (cart || []).reduce((s, i) => s + i.qty, 0);
  $$(".cart-count").forEach((el) => {
    el.textContent = count;
  });
}

/* ---------- QUẢN LÝ TÀI KHOẢN (localStorage) ---------- */
const User = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("vnb_current"));
    } catch {
      return null;
    }
  },
  set(u) {
    localStorage.setItem(
      "vnb_current",
      JSON.stringify({ name: u.name, email: u.email, phone: u.phone || "" }),
    );
  },
  logout() {
    localStorage.removeItem("vnb_current");
  },
  getUsers() {
    try {
      const raw = localStorage.getItem("vnb_users");
      if (raw === null) {
        const initial = typeof DEFAULT_USERS !== "undefined" ? DEFAULT_USERS : [];
        localStorage.setItem("vnb_users", JSON.stringify(initial));
        return [...initial];
      }
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  },
  saveUsers(users) {
    localStorage.setItem("vnb_users", JSON.stringify(users));
  },
};

/* ---------- RENDER LAYOUT HEADER & FOOTER ---------- */
function renderLayout() {
  const user = User.get();
  const headerEl = $("#header");
  if (headerEl) {
    headerEl.innerHTML = `
      <!-- Top Announcement Bar -->
      <div class="top-announcement">
        <div class="wrap top-announcement-inner">
          <div class="announcement-text">
            <span>Chào mừng bạn đến với <b>VNB Shop</b> - Hệ thống phân phối cầu lông chính hãng số 1 Việt Nam!</span>
          </div>
          <div class="announcement-meta">
            <span>Hotline: <b>0123.456.789</b></span>
            <span class="sep">•</span>
            <span>50+ Chi nhánh toàn quốc</span>
          </div>
        </div>
      </div>

      <!-- Main Header Bar -->
      <div class="top-bar">
        <div class="wrap top-bar-inner">
          <a class="logo" href="index.html" title="Trang chủ VNB Shop">
            <img src="img/logovnb.svg" alt="VNB Sports">
          </a>

          <!-- Form tìm kiếm sản phẩm -->
          <form class="search-bar" id="searchForm">
            <span class="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="search" id="q" placeholder="Tìm vợt, giày, áo, phụ kiện cầu lông..." aria-label="Tìm sản phẩm" />
            <button type="submit">Tìm kiếm</button>
          </form>

          <!-- Tài khoản & Giỏ hàng -->
          <div class="user-nav">
            ${
              user
                ? `<div class="user-pill">
                     <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
                     <div class="user-text">
                       <small>Xin chào,</small>
                       <b>${user.name}</b>
                     </div>
                     <button type="button" id="logoutBtn" class="btn-logout" title="Đăng xuất">Đăng xuất</button>
                   </div>`
                : `<div class="auth-btns">
                     <a href="login.html" class="nav-auth-login">Đăng nhập</a>
                     <a href="register.html" class="nav-auth-reg">Đăng ký</a>
                   </div>`
            }
            <a href="cart.html" class="cart-pill-btn" title="Xem giỏ hàng">
              <div class="cart-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span class="cart-count">0</span>
              </div>
              <span class="cart-label">Giỏ hàng</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Main Navigation Menu -->
      <nav class="main-nav">
        <div class="wrap">
          <ul class="nav-menu">
            <li><a href="index.html" class="nav-link">TRANG CHỦ</a></li>
            <li class="has-submenu">
              <a href="products.html" class="nav-link">
                SẢN PHẨM <span class="nav-arrow">▾</span>
              </a>
              <ul class="submenu">
                <li><a href="products.html"><b>Tất cả sản phẩm (24+)</b></a></li>
                ${Object.entries(CATS)
                  .map(([k, v]) => `<li><a href="products.html?cat=${k}">${v}</a></li>`)
                  .join("")}
              </ul>
            </li>
            <li><a href="products.html?tag=sale" class="nav-link nav-sale">SALE OFF <span class="badge-tag sale">HOT</span></a></li>
            <li><a href="products.html?tag=hot" class="nav-link">HÀNG BÁN CHẠY</a></li>
            <li><a href="products.html?tag=new" class="nav-link">HÀNG MỚI VỀ</a></li>
            <li><a href="index.html#lienhe" class="nav-link">LIÊN HỆ</a></li>
          </ul>
        </div>
      </nav>
    `;

    // Active menu link styling
    const path = location.pathname;
    const search = location.search;
    $$(".nav-menu .nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        (path.endsWith(href) || (href.includes("?") && search.includes(href.split("?")[1])))
      ) {
        link.classList.add("active");
      }
    });

    // Bắt sự kiện tìm kiếm
    $("#searchForm").onsubmit = (e) => {
      e.preventDefault();
      const kw = $("#q").value.trim();
      location.href = "products.html?q=" + encodeURIComponent(kw);
    };

    // Bắt sự kiện đăng xuất
    const logoutBtn = $("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        User.logout();
        toast("Đã đăng xuất tài khoản thành công.");
        setTimeout(() => location.reload(), 600);
      };
    }
  }

  // Footer hiện đại 4 cột
  const footerEl = $("#footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <footer class="footer">
        <div class="wrap footer-grid">
          <div class="footer-col">
            <img src="img/logovnb.svg" alt="VNB Sports" class="footer-logo">
            <p class="footer-about">
              <b>VNB Sports</b> - Hệ thống cửa hàng cầu lông uy tín hàng đầu Việt Nam. Cung cấp vợt cầu lông, giày cầu lông, áo và phụ kiện chính hãng từ các thương hiệu Yonex, Lining, Victor, Mizuno, VNB.
            </p>
            <div class="footer-socials">
              <span class="social-text">Facebook</span>
              <span class="social-text">Youtube</span>
              <span class="social-text">TikTok</span>
              <span class="social-text">Zalo</span>
            </div>
          </div>

          <div class="footer-col">
            <h3>THÔNG TIN LIÊN HỆ</h3>
            <ul class="footer-links">
              <li><b>Trụ sở:</b> 123 Đường Cầu Lông, Q.1, TP. HCM</li>
              <li><b>Hotline:</b> 0123.456.789 (8:00 - 21:30)</li>
              <li><b>Email:</b> info@shopvnb.com</li>
              <li><b>Website:</b> shopvnb.com</li>
              <li><b>Thời gian làm việc:</b> Thứ 2 - CN (8:00 - 22:00)</li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>CHÍNH SÁCH BÁN HÀNG</h3>
            <ul class="footer-links">
              <li><a href="#">Chính sách bảo hành chính hãng</a></li>
              <li><a href="#">Chính sách đổi trả hàng trong 7 ngày</a></li>
              <li><a href="#">Chính sách vận chuyển toàn quốc</a></li>
              <li><a href="#">Hướng dẫn đan vợt & bảo quản dụng cụ</a></li>
              <li><a href="#">Quy định bảo mật thông tin</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>PHƯƠNG THỨC THANH TOÁN</h3>
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Hỗ trợ đa dạng phương thức an toàn và tiện lợi:</p>
            <div class="payment-badges">
              <span class="pay-badge">COD</span>
              <span class="pay-badge">VietQR</span>
              <span class="pay-badge">Internet Banking</span>
              <span class="pay-badge">MoMo</span>
            </div>
            <div class="cert-box" style="margin-top: 18px;">
              <span style="font-size: 13px; color: #10b981; font-weight: 600;">100% SẢN PHẨM CHÍNH HÃNG</span>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="wrap footer-bottom-inner">
            <p>© 2026 VNB Sports. WEB1044 Assignment - Thiết kế website bán hàng cao cấp bằng JavaScript.</p>
            <p>Học tập & Thực hành lập trình web.</p>
          </div>
        </div>
      </footer>
    `;
  }

  updateCount();
}

/* ---------- RENDER THẺ SẢN PHẨM HIỆN ĐẠI (CARD) ---------- */
function cardHTML(p) {
  const b = (p.tags && p.tags[0]) || "hot";
  const discount = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const badgeText = b === "new" ? "MỚI" : b === "hot" ? "HOT" : `-${discount}%`;

  return `
    <article class="card" data-id="${p.id}">
      <div class="card-badge-wrap">
        <span class="badge ${b}">${badgeText}</span>
        ${p.brand ? `<span class="badge-brand">${p.brand}</span>` : ""}
      </div>

      <a href="product.html?id=${p.id}" class="card-img-link">
        <div class="im">
          <img src="${imgPath(p.img)}" alt="${p.name}" loading="lazy">
        </div>
      </a>

      <div class="card-info">
        <div class="card-rating">
          <span class="rating-star">★</span>
          <span class="rating-text">5.0</span>
        </div>

        <h3 class="card-title">
          <a href="product.html?id=${p.id}" title="${p.name}">${p.name}</a>
        </h3>

        <div class="price-box">
          <span class="price">${money(p.price)}</span>
          ${p.old ? `<span class="old">${money(p.old)}</span>` : ""}
        </div>

        <div class="card-actions">
          <button class="btn btn-add" type="button" data-id="${p.id}" data-add="${p.id}" title="Thêm vào giỏ hàng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span>Thêm vào giỏ</span>
          </button>
          <a href="product.html?id=${p.id}" class="btn-quickview" title="Xem chi tiết sản phẩm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

// Xử lý nút thêm vào giỏ hàng theo đúng chuẩn huongdanasm2
// B1. tìm ra các nút đó: document.querySelectorAll(".btn-add:not(#btnAddDetail)")
// B2. cho các nút lắng nghe sự kiện "click"
function initAddToCart() {
  const btnAdd = document.querySelectorAll(".btn-add:not(#btnAddDetail)");
  console.log("Danh sách nút thêm vào giỏ:", btnAdd.length);
  btnAdd.forEach((btn) => {
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn sự kiện nổi bọt để không bị kích hoạt 2 lần
      const productID = Number(this.dataset.id || this.dataset.add);
      if (!productID) return;
      Cart.add(productID, 1);
    };
  });
}

// Lắng nghe sự kiện click ủy quyền dự phòng trên document
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-add, [data-add]");
  if (btn && btn.id !== "btnAddDetail" && btn.id !== "btnBuyNow" && !btn.onclick) {
    e.preventDefault();
    const productID = Number(btn.dataset.id || btn.dataset.add);
    if (!productID) return;
    Cart.add(productID, 1);
  }
});

const grid = (el, list, emptyMsg = '<p class="empty">Không tìm thấy sản phẩm phù hợp.</p>') => {
  if (!el) return;
  el.innerHTML = list.length ? list.map(cardHTML).join("") : emptyMsg;
  initAddToCart();

  // Render sản phẩm vào #products-list theo huongdanasm2
  const productslist = document.getElementById("products-list");
  if (productslist) {
    productslist.innerHTML = "";
    (typeof products !== "undefined" ? products : PRODUCTS).forEach((p) => {
      productslist.innerHTML += `
        <button class="btn-add" type="button" data-id="${p.id}">Thêm ${p.name}</button>
      `;
    });
    initAddToCart();
  }
};

/* ---------- BANNER SLIDER ---------- */
function initSlider() {
  const s = $(".slider");
  if (!s) return;
  const box = $(".slides", s);
  if (!box) return;
  const n = box.children.length;
  const dots = $(".dots", s);
  let i = 0,
    timer;

  dots.innerHTML = [...Array(n)]
    .map((_, k) => `<button aria-label="Slide ${k + 1}"></button>`)
    .join("");

  const go = (k) => {
    i = (k + n) % n;
    box.style.transform = `translateX(-${i * 100}%)`;
    $$("button", dots).forEach((d, j) => d.classList.toggle("on", j === i));
  };

  const auto = () => {
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 3000); // Tự động đổi ảnh banner sau mỗi 3 giây
  };

  const prevBtn = $(".prev", s);
  const nextBtn = $(".next", s);
  if (prevBtn)
    prevBtn.onclick = () => {
      go(i - 1);
      auto();
    };
  if (nextBtn)
    nextBtn.onclick = () => {
      go(i + 1);
      auto();
    };

  $$("button", dots).forEach((d, k) => {
    d.onclick = () => {
      go(k);
      auto();
    };
  });

  s.onmouseenter = () => clearInterval(timer);
  s.onmouseleave = auto;
  go(0);
  auto();
}

/* ---------- ĐẾM NGƯỢC FLASH SALE ---------- */
function initCountdown() {
  const el = $("#countdown");
  if (!el) return;
  const tick = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let d = Math.max(0, end - new Date());
    const h = Math.floor(d / 3.6e6);
    const m = Math.floor((d % 3.6e6) / 6e4);
    const s = Math.floor((d % 6e4) / 1e3);
    const f = (x) => String(x).padStart(2, "0");
    el.innerHTML = `
      <span class="cd-box">${f(h)}</span>
      <span class="cd-sep">:</span>
      <span class="cd-box">${f(m)}</span>
      <span class="cd-sep">:</span>
      <span class="cd-box">${f(s)}</span>
    `;
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- TRANG CHỦ (index.html) ---------- */
function pageHome() {
  const tabs = $("#tabs");
  if (tabs) {
    tabs.innerHTML = Object.entries(TAGS)
      .map(
        ([k, v], i) => `<button data-tag="${k}" class="${i === 0 ? "active" : ""}">${v}</button>`,
      )
      .join("");

    const show = (t) => {
      grid($("#home-grid"), PRODUCTS.filter((p) => p.tags.includes(t)).slice(0, 8));
    };

    tabs.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", tabs).forEach((x) => x.classList.toggle("active", x === b));
      show(b.dataset.tag);
    };

    show("new");
  }

  const catsEl = $("#cats");
  if (catsEl) {
    catsEl.innerHTML = Object.entries(CATS)
      .map(
        ([k, v]) => `
          <a class="cat" href="products.html?cat=${k}">
            <img src="${imgPath(CAT_IMG[k])}" alt="${v}">
            <div class="cat-content">
              <span>${v.toUpperCase()}</span>
              <small>Xem sản phẩm →</small>
            </div>
          </a>
        `,
      )
      .join("");
  }

  const f = $("#contactForm");
  if (f) {
    f.onsubmit = (e) => {
      e.preventDefault();
      if (
        validate(f, {
          name: { req: 1 },
          email: { req: 1, email: 1 },
          phone: { req: 1, phone: 1 },
          msg: { req: 1, min: 10 },
        })
      ) {
        toast("Cảm ơn bạn! Chuyên viên VNB Shop sẽ liên hệ tư vấn trong 15 phút.");
        f.reset();
      }
    };
  }
}

/* ---------- TRANG SẢN PHẨM: TÌM KIẾM, LỌC & SẮP XẾP (products.html) ---------- */
function pageList() {
  const q = new URLSearchParams(location.search);
  let activeCat = q.get("cat") || "";
  let activeTag = q.get("tag") || "";
  let activeKw = (q.get("q") || "").toLowerCase().trim();

  // Điền từ khoá tìm kiếm lên ô header nếu có
  const searchInput = $("#q");
  if (searchInput && activeKw) {
    searchInput.value = activeKw;
  }

  const brands = [...new Set(PRODUCTS.map((p) => p.brand))];
  const prices = [
    ["Dưới 500.000đ", 0, 500000],
    ["500.000đ - 1.000.000đ", 500000, 1000000],
    ["1.000.000đ - 3.000.000đ", 1000000, 3000000],
    ["Trên 3.000.000đ", 3000000, 100000000],
  ];

  // Render bộ lọc bên Sidebar
  const filtersEl = $("#filters");
  if (filtersEl) {
    filtersEl.innerHTML = `
      <div class="sidebar-header">
        <h3>BỘ LỌC TÌM KIẾM</h3>
      </div>

      <div class="filter-group">
        <h4>DANH MỤC</h4>
        <label class="custom-control">
          <input type="radio" name="cat" value="" ${!activeCat ? "checked" : ""}>
          <span class="control-label">Tất cả sản phẩm</span>
        </label>
        ${Object.entries(CATS)
          .map(
            ([k, v]) => `
              <label class="custom-control">
                <input type="radio" name="cat" value="${k}" ${activeCat === k ? "checked" : ""}>
                <span class="control-label">${v}</span>
              </label>
            `,
          )
          .join("")}
      </div>

      <div class="filter-group">
        <h4>KHOẢNG GIÁ</h4>
        ${prices
          .map(
            (p, i) => `
              <label class="custom-control">
                <input type="checkbox" name="price" value="${i}">
                <span class="control-label">${p[0]}</span>
              </label>
            `,
          )
          .join("")}
      </div>

      <div class="filter-group">
        <h4>THƯƠNG HIỆU</h4>
        <div class="brand-tags-grid">
          ${brands
            .map(
              (b) => `
                <label class="brand-chip">
                  <input type="checkbox" name="brand" value="${b}">
                  <span>${b}</span>
                </label>
              `,
            )
            .join("")}
        </div>
      </div>

      <button type="button" class="btn btn-outline" id="resetFilters" style="width:100%;margin-top:14px">
        ↺ Đặt lại bộ lọc
      </button>
    `;
  }

  // Hàm áp dụng tất cả tiêu chí
  const apply = () => {
    const selectedCatRadio = $("input[name=cat]:checked");
    const catVal = selectedCatRadio ? selectedCatRadio.value : activeCat;

    let list = PRODUCTS.filter((p) => {
      const matchCat = !catVal || p.cat === catVal;
      const matchTag = !activeTag || p.tags.includes(activeTag);
      const matchKw =
        !activeKw ||
        p.name.toLowerCase().includes(activeKw) ||
        p.brand.toLowerCase().includes(activeKw) ||
        (p.desc && p.desc.toLowerCase().includes(activeKw));
      return matchCat && matchTag && matchKw;
    });

    // Lọc theo khoảng giá
    const prChecked = $$("[name=price]:checked").map((x) => prices[x.value]);
    if (prChecked.length) {
      list = list.filter((p) => prChecked.some((r) => p.price >= r[1] && p.price < r[2]));
    }

    // Lọc theo thương hiệu
    const brChecked = $$("[name=brand]:checked").map((x) => x.value);
    if (brChecked.length) {
      list = list.filter((p) => brChecked.includes(p.brand));
    }

    // Sắp xếp
    const s = $("#sort") ? $("#sort").value : "";
    if (s === "asc") list.sort((a, b) => a.price - b.price);
    else if (s === "desc") list.sort((a, b) => b.price - a.price);
    else if (s === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    else if (s === "name_desc") list.sort((a, b) => b.name.localeCompare(a.name, "vi"));

    // Cập nhật tiêu đề trang
    const titleEl = $("#list-title");
    if (titleEl) {
      if (activeKw) titleEl.textContent = `Kết quả cho: "${activeKw}"`;
      else if (catVal) titleEl.textContent = CATS[catVal];
      else if (activeTag) titleEl.textContent = TAGS[activeTag];
      else titleEl.textContent = "Tất cả sản phẩm";
    }

    const countEl = $("#count");
    if (countEl) countEl.textContent = `${list.length} sản phẩm`;

    // Render kết quả
    grid(
      $("#list"),
      list,
      `
        <div class="empty-state-box" style="grid-column: 1 / -1;">
          <h3>Không tìm thấy sản phẩm phù hợp</h3>
          <p>Hãy thử tìm với từ khóa khác hoặc xóa bớt các tiêu chí lọc đang chọn.</p>
          <button class="btn btn-primary" id="btnEmptyReset" style="margin-top: 14px;">Xem tất cả sản phẩm</button>
        </div>
      `,
    );

    const btnEmptyReset = $("#btnEmptyReset");
    if (btnEmptyReset) {
      btnEmptyReset.onclick = resetAllFilters;
    }
  };

  const resetAllFilters = () => {
    activeKw = "";
    activeTag = "";
    activeCat = "";
    if ($("#q")) $("#q").value = "";
    const allCatRadio = $("input[name=cat][value='']");
    if (allCatRadio) allCatRadio.checked = true;
    $$("[name=price]").forEach((x) => (x.checked = false));
    $$("[name=brand]").forEach((x) => (x.checked = false));
    if ($("#sort")) $("#sort").value = "";
    apply();
  };

  if (filtersEl) filtersEl.onchange = apply;
  if ($("#sort")) $("#sort").onchange = apply;

  const btnReset = $("#resetFilters");
  if (btnReset) btnReset.onclick = resetAllFilters;

  // Lắng nghe tìm kiếm trực tiếp trên thanh tìm kiếm
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeKw = e.target.value.trim().toLowerCase();
      apply();
    });
  }

  apply();
}

/* ---------- TRANG CHI TIẾT SẢN PHẨM (product.html) ---------- */
function pageDetail() {
  const pId = +new URLSearchParams(location.search).get("id");
  const p = PRODUCTS.find((x) => x.id === pId) || PRODUCTS[0];
  document.title = p.name + " | VNB Shop";

  // Breadcrumb
  const bc = $("#detailBreadcrumb");
  if (bc) {
    bc.innerHTML = `
      <a href="index.html">Trang chủ</a> / 
      <a href="products.html?cat=${p.cat}">${CATS[p.cat] || p.cat}</a> / 
      <span>${p.name}</span>
    `;
  }

  const imgs = [p.img, ...(p.imgs || []).filter((i) => i !== p.img)];
  const discount = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const detailEl = $("#detail");

  if (detailEl) {
    detailEl.innerHTML = `
      <!-- Gallery ảnh bên trái -->
      <div class="detail-gallery">
        <div class="main-img-box">
          <img id="mainImg" class="main-img" src="${imgPath(imgs[0])}" alt="${p.name}">
          ${discount ? `<span class="detail-discount-badge">-${discount}%</span>` : ""}
        </div>
        <div class="thumbs">
          ${imgs.map((f, i) => `<img src="${imgPath(f)}" class="${i === 0 ? "on" : ""}" alt="Ảnh ${i + 1}">`).join("")}
        </div>
      </div>

      <!-- Thông tin sản phẩm bên phải -->
      <div class="detail-info">
        <div class="detail-tags">
          <span class="cat-pill">${CATS[p.cat] || p.cat}</span>
          <span class="brand-pill">Thương hiệu: <b>${p.brand}</b></span>
          <span class="sku-pill">Mã SP: <b>#SP00${p.id}</b></span>
        </div>

        <h1 class="detail-title">${p.name}</h1>

        <div class="detail-rating-row">
          <span class="rating-star">★</span>
          <span class="score">4.9/5</span>
          <span class="reviews">(86 lượt đánh giá)</span>
          <span class="sep">•</span>
          <span class="stock-status">Còn hàng</span>
        </div>

        <div class="detail-price-card">
          <div class="price-current">${money(p.price)}</div>
          ${p.old ? `<div class="price-old">${money(p.old)}</div>` : ""}
          ${discount ? `<div class="savings-tag">Tiết kiệm: ${money(p.old - p.price)} (-${discount}%)</div>` : ""}
        </div>

        <p class="detail-desc">${p.desc}</p>

        <!-- Khối cam kết & chính sách -->
        <div class="benefits-grid">
          <div class="benefit-item">
            <div>
              <b>100% Chính hãng</b>
              <small>Bảo hành chính hãng, nguồn gốc rõ ràng</small>
            </div>
          </div>
          <div class="benefit-item">
            <div>
              <b>Tặng quà phụ kiện</b>
              <small>Tặng bao đựng vợt & quấn cán cao cấp</small>
            </div>
          </div>
          <div class="benefit-item">
            <div>
              <b>Miễn phí đan vợt</b>
              <small>Căng cước theo yêu cầu bằng máy điện tử</small>
            </div>
          </div>
          <div class="benefit-item">
            <div>
              <b>Đổi mới 7 ngày</b>
              <small>Bảo hành 3 tháng chuẩn nhà sản xuất</small>
            </div>
          </div>
        </div>

        <!-- Bộ chọn số lượng & nút mua -->
        <div class="detail-buy-box">
          <div class="qty-select-group">
            <label>Số lượng:</label>
            <div class="qty">
              <button id="qtyMinus" type="button" aria-label="Giảm">-</button>
              <input id="detailQty" type="number" value="1" min="1" aria-label="Số lượng">
              <button id="qtyPlus" type="button" aria-label="Tăng">+</button>
            </div>
          </div>

          <div class="detail-cta-group">
            <button class="btn btn-add btn-add-detail" id="btnAddDetail" data-id="${p.id}" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span>THÊM VÀO GIỎ HÀNG</span>
            </button>
            <button class="btn btn-buynow-detail" id="btnBuyNow">
              MUA NGAY (GIAO TẬN NƠI)
            </button>
          </div>
        </div>
      </div>
    `;

    const getQ = () => Math.max(1, parseInt($("#detailQty").value) || 1);

    // Click đổi ảnh đại diện
    $(".thumbs").onclick = (e) => {
      if (e.target.tagName === "IMG") {
        $("#mainImg").src = e.target.src;
        $$(".thumbs img").forEach((i) => i.classList.toggle("on", i === e.target));
      }
    };

    // Tăng giảm số lượng
    $("#qtyMinus").onclick = () => ($("#detailQty").value = Math.max(1, getQ() - 1));
    $("#qtyPlus").onclick = () => ($("#detailQty").value = getQ() + 1);

    // Thêm vào giỏ
    const btnAddEl = $("#btnAddDetail");
    if (btnAddEl) {
      btnAddEl.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Cart.add(p.id, getQ());
      };
    }

    // Mua ngay
    const btnBuyEl = $("#btnBuyNow");
    if (btnBuyEl) {
      btnBuyEl.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Cart.add(p.id, getQ());
        location.href = "cart.html";
      };
    }
  }

  // Sản phẩm liên quan cùng danh mục
  const relatedList = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  grid($("#related"), relatedList);
}

/* ---------- TRANG GIỎ HÀNG (cart.html) ---------- */
function pageCart() {
  let coupon = sessionStorage.getItem("vnb_coupon") || "";

  const draw = () => {
    const c = Cart.get();
    const box = $("#cart");
    const toolbar = $("#cartToolbar");
    const summarySection = $("#cartSummary");

    if (!c.length) {
      box.innerHTML = `
        <div class="empty-state-box" style="padding: 60px 20px;">
          <h2>Giỏ hàng của bạn đang trống!</h2>
          <p>Hiện chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và chọn ngay sản phẩm ưng ý nhé.</p>
          <a class="btn btn-primary btn-lg" href="products.html" style="margin-top: 16px;">Khám phá sản phẩm ngay →</a>
        </div>
      `;
      if (toolbar) toolbar.style.display = "none";
      if (summarySection) summarySection.style.display = "none";
      return;
    }

    if (toolbar) toolbar.style.display = "flex";
    if (summarySection) summarySection.style.display = "grid";

    // Bảng danh sách sản phẩm trong giỏ
    box.innerHTML = `
      <div class="table-container">
        <table class="cart-table">
          <thead>
            <tr>
              <th style="width: 90px;">Hình ảnh</th>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th style="width: 140px; text-align: center;">Số lượng</th>
              <th>Thành tiền</th>
              <th style="width: 50px; text-align: center;">Xóa</th>
            </tr>
          </thead>
          <tbody>
            ${c
              .map((item) => {
                const p = PRODUCTS.find((x) => x.id === item.id);
                if (!p) return "";
                return `
                  <tr>
                    <td>
                      <a href="product.html?id=${p.id}" class="table-img-link">
                        <img src="${imgPath(p.img)}" alt="${p.name}">
                      </a>
                    </td>
                    <td>
                      <a href="product.html?id=${p.id}" class="table-prod-title">${p.name}</a>
                      <div class="table-prod-meta">Thương hiệu: <b>${p.brand}</b> | Mã: #SP00${p.id}</div>
                    </td>
                    <td class="unit-price">${money(p.price)}</td>
                    <td style="text-align: center;">
                      <span class="qty">
                        <button data-q="${p.id}" data-d="-1" type="button" aria-label="Giảm">-</button>
                        <input value="${item.qty}" data-in="${p.id}" type="number" min="1" aria-label="Số lượng">
                        <button data-q="${p.id}" data-d="1" type="button" aria-label="Tăng">+</button>
                      </span>
                    </td>
                    <td class="price" style="font-size: 16px;">${money(p.price * item.qty)}</td>
                    <td style="text-align: center;">
                      <button class="rm" data-rm="${p.id}" title="Xóa sản phẩm">✕</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    // Tính toán tiền
    const t = Cart.total();
    const pct = COUPONS[coupon] || 0;
    const disc = Math.round((t * pct) / 100);
    const finalTotal = Math.max(0, t - disc);

    const summaryEl = $("#summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="sum-row">
          <span>Tạm tính hàng:</span>
          <b>${money(t)}</b>
        </div>
        ${
          pct
            ? `<div class="sum-row highlight-green">
                 <span>Mã giảm giá (${coupon} - ${pct}%):</span>
                 <b>-${money(disc)}</b>
               </div>`
            : ""
        }
        <div class="sum-row">
          <span>Phí vận chuyển:</span>
          <b class="highlight-green">Miễn phí toàn quốc</b>
        </div>
        <hr class="sum-divider">
        <div class="sum-row total-row">
          <span>Tổng thanh toán:</span>
          <span class="price-grand">${money(finalTotal)}</span>
        </div>
        <small class="sum-note">(Đã bao gồm VAT và quà tặng kèm)</small>
      `;
    }
  };

  // Tương tác nút tăng/giảm/xóa
  $("#cart").onclick = (e) => {
    const qBtn = e.target.closest("[data-q]");
    const rmBtn = e.target.closest("[data-rm]");

    if (qBtn) {
      const pId = +qBtn.dataset.q;
      const delta = +qBtn.dataset.d;
      const item = Cart.get().find((x) => x.id === pId);
      if (item) {
        Cart.setQty(pId, item.qty + delta);
        draw();
      }
    }

    if (rmBtn) {
      Cart.remove(+rmBtn.dataset.rm);
      draw();
    }
  };

  // Nhập số lượng trực tiếp
  $("#cart").onchange = (e) => {
    if (e.target.dataset.in) {
      const pId = +e.target.dataset.in;
      const val = parseInt(e.target.value) || 1;
      Cart.setQty(pId, val);
      draw();
    }
  };

  // Nút xóa toàn bộ giỏ
  const clearBtn = $("#clearCart");
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?")) {
        Cart.clear();
        draw();
      }
    };
  }

  // Click chọn nhanh chip coupon
  $$(".chip-btn").forEach((btn) => {
    btn.onclick = () => {
      const cCode = btn.dataset.coupon;
      $("#couponIn").value = cCode;
      $("#applyCoupon").click();
    };
  });

  // Áp dụng coupon
  const couponBtn = $("#applyCoupon");
  if (couponBtn) {
    couponBtn.onclick = () => {
      const input = $("#couponIn");
      const val = (input.value || "").trim().toUpperCase();
      const msgEl = $("#couponMsg");

      if (COUPONS[val]) {
        coupon = val;
        sessionStorage.setItem("vnb_coupon", val);
        toast(`Áp dụng mã ưu đãi ${val} (-${COUPONS[val]}%) thành công!`);
        if (msgEl) {
          msgEl.style.color = "#10b981";
          msgEl.textContent = `✓ Đã giảm ${COUPONS[val]}% cho toàn đơn hàng.`;
        }
      } else {
        coupon = "";
        sessionStorage.removeItem("vnb_coupon");
        toast("Mã giảm giá không hợp lệ!", "error");
        if (msgEl) {
          msgEl.style.color = "#ef4444";
          msgEl.textContent = "✕ Mã không tồn tại hoặc đã hết hạn.";
        }
      }
      draw();
    };
  }

  window.drawCartView = draw;
  draw();
  renderCart();
}

/* ---------- TRANG THANH TOÁN (checkout.html) ---------- */
function pageCheckout() {
  const container = $("#checkoutContent");
  if (!container) return;

  const checkoutItems = Cart.get();
  if (!checkoutItems.length) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 60px 20px;">
        <h2>Không có đơn hàng nào cần thanh toán</h2>
        <p>Giỏ hàng của bạn đang trống. Hãy quay lại chọn sản phẩm nhé!</p>
        <a class="btn btn-primary" href="products.html" style="margin-top: 16px;">Mua sắm ngay →</a>
      </div>
    `;
    return;
  }

  const user = User.get();
  const coupon = sessionStorage.getItem("vnb_coupon") || "";
  const subtotal = Cart.total();
  const discountPct = COUPONS[coupon] || 0;
  const discountVal = Math.round((subtotal * discountPct) / 100);
  const grandTotal = Math.max(0, subtotal - discountVal);

  container.innerHTML = `
    <div class="checkout-grid">
      <!-- Cột trái: Form nhận hàng & Phương thức thanh toán -->
      <form class="box checkout-form-card" id="orderForm" novalidate>
        <div class="card-head-line">
          <h3>1. THÔNG TIN GIAO HÀNG</h3>
        </div>

        ${
          !user
            ? `<div class="checkout-login-hint">
                 <span>Đã có tài khoản?</span>
                 <a href="login.html?next=checkout.html">Đăng nhập để điền nhanh thông tin</a>
               </div>`
            : `<div class="checkout-user-badge">
                 Thành viên: <b>${user.name}</b> (${user.email})
               </div>`
        }

        <div class="field">
          <label>Họ và tên người nhận hàng (*)</label>
          <input name="name" placeholder="Ví dụ: Nguyễn Văn A" value="${user ? user.name : ""}" />
          <span class="err"></span>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Số điện thoại liên hệ (*)</label>
            <input name="phone" placeholder="10 số, bắt đầu bằng 0" value="${user ? user.phone : ""}" />
            <span class="err"></span>
          </div>
          <div class="field">
            <label>Địa chỉ Email nhận hóa đơn (*)</label>
            <input name="email" type="email" placeholder="email@gmail.com" value="${user ? user.email : ""}" />
            <span class="err"></span>
          </div>
        </div>

        <div class="field">
          <label>Địa chỉ nhận hàng chi tiết (*)</label>
          <input name="address" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." />
          <span class="err"></span>
        </div>

        <div class="field">
          <label>Ghi chú đơn hàng (Tùy chọn)</label>
          <textarea name="note" rows="2" placeholder="Ví dụ: Căng cước 10.5kg, giao giờ hành chính, gọi trước khi đến..."></textarea>
          <span class="err"></span>
        </div>

        <div class="card-head-line" style="margin-top: 24px;">
          <h3>2. PHƯƠNG THỨC THANH TOÁN</h3>
        </div>

        <div class="payment-card-options">
          <label class="pay-option active">
            <input type="radio" name="payment" value="cod" checked>
            <div class="pay-option-content">
              <div>
                <b>Thanh toán khi nhận hàng (COD)</b>
                <small>Nhận hàng, kiểm tra hàng thoải mái rồi mới thanh toán tiền mặt</small>
              </div>
            </div>
          </label>

          <label class="pay-option">
            <input type="radio" name="payment" value="bank">
            <div class="pay-option-content">
              <div>
                <b>Chuyển khoản ngân hàng (VietQR / Internet Banking)</b>
                <small>Quét mã VietQR chuyển khoản nhanh 24/7 không cần gõ STK</small>
              </div>
            </div>
          </label>
        </div>

        <button type="submit" class="btn btn-order-confirm">
          XÁC NHẬN ĐẶT HÀNG
        </button>
      </form>

      <!-- Cột phải: Tóm tắt đơn hàng -->
      <div class="box checkout-summary-card">
        <div class="card-head-line">
          <h3>ĐƠN HÀNG CỦA BẠN (${checkoutItems.length} món)</h3>
        </div>

        <div class="checkout-items-list">
          ${checkoutItems
            .map((item) => {
              const p = PRODUCTS.find((x) => x.id === item.id);
              if (!p) return "";
              return `
                <div class="checkout-item-row">
                  <img src="${imgPath(p.img)}" alt="${p.name}">
                  <div class="chk-item-info">
                    <div class="chk-name">${p.name}</div>
                    <div class="chk-meta">${money(p.price)} × <b>${item.qty}</b></div>
                  </div>
                  <div class="chk-total">${money(p.price * item.qty)}</div>
                </div>
              `;
            })
            .join("")}
        </div>

        <div class="chk-calc-block">
          <div class="sum-row">
            <span>Tạm tính:</span>
            <b>${money(subtotal)}</b>
          </div>
          ${
            discountPct
              ? `<div class="sum-row highlight-green">
                   <span>Ưu đãi voucher (${coupon}):</span>
                   <b>-${money(discountVal)}</b>
                 </div>`
              : ""
          }
          <div class="sum-row">
            <span>Phí vận chuyển:</span>
            <b class="highlight-green">0đ (Miễn phí)</b>
          </div>
          <hr class="sum-divider">
          <div class="sum-row total-row">
            <span>Tổng thanh toán:</span>
            <span class="price-grand">${money(grandTotal)}</span>
          </div>
        </div>

        <div class="chk-guarantee">
          <p>Bảo đảm thông tin cá nhân được bảo mật 100%.</p>
          <p>Nhân viên CSKH sẽ gọi xác nhận đơn hàng trước khi gửi.</p>
        </div>
      </div>
    </div>
  `;

  // Đổi active border phương thức thanh toán
  $$(".pay-option input").forEach((radio) => {
    radio.onchange = () => {
      $$(".pay-option").forEach((el) => el.classList.remove("active"));
      radio.closest(".pay-option").classList.add("active");
    };
  });

  // Submit đơn hàng
  const f = $("#orderForm");
  if (!f) return;

  f.onsubmit = (e) => {
    e.preventDefault();
    const isValid = validate(f, {
      name: { req: 1 },
      phone: { req: 1, phone: 1 },
      email: { req: 1, email: 1 },
      address: { req: 1, min: 4 },
    });

    if (!isValid) {
      const firstBad = f.querySelector(".field.bad input, .field.bad textarea");
      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast("Vui lòng điền đầy đủ và chính xác thông tin giao hàng (*)", "error");
      return;
    }

    const orderId = "VNB-" + Math.floor(100000 + Math.random() * 900000);
    const customerName = (f.querySelector('[name="name"]') || f.name)?.value.trim() || "Quý khách";
    const customerPhone = (f.querySelector('[name="phone"]') || f.phone)?.value.trim() || "";
    const customerAddress = (f.querySelector('[name="address"]') || f.address)?.value.trim() || "";

    const selectedPay = f.querySelector('input[name="payment"]:checked');
    const paymentMethod =
      selectedPay && selectedPay.value === "bank"
        ? "Chuyển khoản VietQR / Internet Banking"
        : "Thanh toán khi nhận hàng (COD)";

    // Lưu thông tin đơn hàng vào localStorage để tra cứu nếu cần
    try {
      const orders = JSON.parse(localStorage.getItem("vnb_orders") || "[]");
      orders.push({
        id: orderId,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        payment: paymentMethod,
        items: checkoutItems,
        total: grandTotal,
        date: new Date().toLocaleString("vi-VN"),
      });
      localStorage.setItem("vnb_orders", JSON.stringify(orders));
    } catch {}

    // Xóa sạch giỏ hàng và lưu mảng rỗng [] vào localStorage
    Cart.save([]);
    sessionStorage.removeItem("vnb_coupon");
    updateCount();

    // Cập nhật giao diện bước 3 Hoàn tất
    const steps = $(".checkout-steps");
    if (steps) {
      steps.innerHTML = `
        <div class="step completed"><span class="step-num">✓</span><span class="step-name">Giỏ hàng</span></div>
        <div class="step-divider active"></div>
        <div class="step completed"><span class="step-num">✓</span><span class="step-name">Thông tin giao hàng</span></div>
        <div class="step-divider active"></div>
        <div class="step active"><span class="step-num">✓</span><span class="step-name">Hoàn tất</span></div>
      `;
    }

    // Hiển thị giao diện hoàn tất đơn hàng
    container.innerHTML = `
      <div class="order-success-card">
        <div class="success-icon-wrap">
          <span class="check-symbol">✓</span>
        </div>
        <h2>ĐẶT HÀNG THÀNH CÔNG!</h2>
        <p class="success-sub">Cảm ơn bạn <b>${customerName}</b> đã mua sắm tại VNB Sports.</p>

        <div class="order-receipt-box">
          <div class="receipt-row">
            <span>Mã đơn hàng:</span>
            <span class="order-code">#${orderId}</span>
          </div>
          <div class="receipt-row">
            <span>Số điện thoại:</span>
            <b>${customerPhone}</b>
          </div>
          <div class="receipt-row">
            <span>Địa chỉ nhận hàng:</span>
            <b>${customerAddress}</b>
          </div>
          <div class="receipt-row">
            <span>Phương thức thanh toán:</span>
            <b>${paymentMethod}</b>
          </div>
          <div class="receipt-row receipt-total">
            <span>Tổng số tiền cần thanh toán:</span>
            <span class="price-grand">${money(grandTotal)}</span>
          </div>
        </div>

        <p class="receipt-note">
          Đơn hàng đã được lưu vào hệ thống. Chuyên viên VNB Shop sẽ gọi điện xác nhận trong vòng 15 phút.
        </p>

        <div class="success-actions">
          <a class="btn btn-primary" href="index.html">Về Trang Chủ</a>
          <a class="btn btn-outline" href="products.html">Tiếp Tục Mua Hàng</a>
        </div>
      </div>
    `;

    toast("Đặt hàng thành công! Cảm ơn bạn.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

/* ---------- KIỂM TRA BIỂU MẪU (FORM VALIDATION) ---------- */
function validate(form, rules) {
  let ok = true;
  for (const [fieldName, rule] of Object.entries(rules)) {
    const el = form.elements[fieldName];
    if (!el) continue;
    const v = el.value.trim();
    let msg = "";

    if (rule.req && !v) {
      msg = "Vui lòng nhập thông tin này";
    } else if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      msg = "Email không đúng định dạng (ví dụ: ten@gmail.com)";
    } else if (rule.phone && !/^(0|\+84)\d{9}$/.test(v.replace(/[\s.-]/g, ""))) {
      msg = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
    } else if (rule.min && v.length < rule.min) {
      msg = `Tối thiểu ${rule.min} ký tự`;
    } else if (rule.match && v !== form.elements[rule.match].value) {
      msg = "Mật khẩu xác nhận không khớp";
    }

    const parent = el.closest(".field") || el.parentElement;
    parent.classList.toggle("bad", !!msg);
    const errSpan = parent.querySelector(".err");
    if (errSpan) errSpan.textContent = msg;
    if (msg) ok = false;
  }
  return ok;
}

/* ---------- TRANG ĐĂNG KÝ & ĐĂNG NHẬP (login.html, register.html THEO HƯỚNG DẪN huongdanasm2) ---------- */
function pageAuth() {
  const registerForm =
    document.getElementById("register-form") || $("#authForm[data-type='register']");
  const loginForm = $("#authForm[data-type='login']") || $("#authForm");

  // Xử lý form đăng ký tài khoản theo đúng bài giảng huongdanasm2
  if (registerForm && registerForm.dataset.type === "register") {
    // Đồng bộ input với các thẻ custom email, password, confirmPassword
    const syncTags = () => {
      const emailVal =
        (registerForm.querySelector("#email") || registerForm.querySelector("[name='email']"))
          ?.value || "";
      const passVal =
        (registerForm.querySelector("#password") || registerForm.querySelector("[name='password']"))
          ?.value || "";
      const repassVal =
        (
          registerForm.querySelector("#confirmPassword") ||
          registerForm.querySelector("[name='repass']")
        )?.value || "";

      const emTag = registerForm.querySelector("email");
      if (emTag) emTag.value = emailVal;
      const pwTag = registerForm.querySelector("password");
      if (pwTag) pwTag.value = passVal;
      const cpwTag = registerForm.querySelector("confirmPassword");
      if (cpwTag) cpwTag.value = repassVal;
    };

    registerForm.addEventListener("input", syncTags);

    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      syncTags();

      const fullNameEl =
        registerForm.querySelector("#full-name") || registerForm.querySelector("[name='name']");
      const emailEl =
        registerForm.querySelector("#email") ||
        registerForm.querySelector("email") ||
        registerForm.querySelector("[name='email']");
      const passwordEl =
        registerForm.querySelector("#password") ||
        registerForm.querySelector("password") ||
        registerForm.querySelector("[name='password']");
      const confirmPasswordEl =
        registerForm.querySelector("#confirmPassword") ||
        registerForm.querySelector("confirmPassword") ||
        registerForm.querySelector("[name='repass']");

      const fullName = fullNameEl ? fullNameEl.value.trim() : "";
      const email = emailEl ? emailEl.value.trim() : "";
      const password = passwordEl ? passwordEl.value.trim() : "";
      const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value.trim() : "";

      // Reset giao diện báo lỗi
      registerForm.querySelectorAll(".field").forEach((f) => f.classList.remove("bad"));
      registerForm.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
      const authMsg = $("#authMsg");
      if (authMsg) {
        authMsg.textContent = "";
        authMsg.style.display = "none";
      }

      let isValid = true;
      if (fullName.length === 0) {
        alert("Vui lòng nhập họ và tên");
        if (fullNameEl) {
          const p = fullNameEl.closest(".field") || fullNameEl.parentElement;
          p.classList.add("bad");
          const err = p.querySelector(".err");
          if (err) err.textContent = "Vui lòng nhập họ và tên";
        }
        isValid = false;
      }
      if (email.length === 0) {
        alert("Vui lòng nhập email ");
        if (emailEl) {
          const p = emailEl.closest(".field") || emailEl.parentElement;
          p.classList.add("bad");
          const err = p.querySelector(".err");
          if (err) err.textContent = "Vui lòng nhập email ";
        }
        isValid = false;
      }
      if (password.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên");
        if (passwordEl) {
          const p = passwordEl.closest(".field") || passwordEl.parentElement;
          p.classList.add("bad");
          const err = p.querySelector(".err");
          if (err) err.textContent = "Mật khẩu phải từ 6 ký tự trở lên";
        }
        isValid = false;
      }
      if (confirmPassword != password) {
        alert("Mật khẩu và xác nhập mật khẩu phải giống nhau");
        if (confirmPasswordEl) {
          const p = confirmPasswordEl.closest(".field") || confirmPasswordEl.parentElement;
          p.classList.add("bad");
          const err = p.querySelector(".err");
          if (err) err.textContent = "Mật khẩu và xác nhập mật khẩu phải giống nhau";
        }
        isValid = false;
      }

      if (isValid) {
        // Nếu hợp lệ thì cho đăng ký
        const users = User.getUsers();
        const isExist = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (isExist) {
          if (authMsg) {
            authMsg.textContent = "Email này đã được sử dụng. Vui lòng chọn email khác!";
            authMsg.style.display = "block";
          }
          alert("Email này đã được đăng ký! Vui lòng chọn email khác.");
          return;
        }

        users.push({
          name: fullName,
          email: email.toLowerCase(),
          phone: registerForm.phone ? registerForm.phone.value.trim() : "",
          password: password,
        });
        User.saveUsers(users);

        alert("Đăng ký thành công");
        toast("Đăng ký thành công! Đang chuyển hướng sang đăng nhập...");
        setTimeout(() => {
          location.href = "login.html" + location.search;
        }, 1000);
      }
    });
  }

  // Xử lý form đăng nhập
  if (loginForm && loginForm.dataset.type === "login") {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const authMsg = $("#authMsg");
      if (authMsg) {
        authMsg.textContent = "";
        authMsg.style.display = "none";
      }

      const emailEl = loginForm.email;
      const passEl = loginForm.password;
      const inputEmail = emailEl ? emailEl.value.trim().toLowerCase() : "";
      const inputPassword = passEl ? passEl.value : "";

      loginForm.querySelectorAll(".field").forEach((f) => f.classList.remove("bad"));
      loginForm.querySelectorAll(".err").forEach((e) => (e.textContent = ""));

      let ok = true;
      if (!inputEmail) {
        const p = emailEl.closest(".field") || emailEl.parentElement;
        p.classList.add("bad");
        const err = p.querySelector(".err");
        if (err) err.textContent = "Vui lòng nhập email";
        ok = false;
      }
      if (!inputPassword) {
        const p = passEl.closest(".field") || passEl.parentElement;
        p.classList.add("bad");
        const err = p.querySelector(".err");
        if (err) err.textContent = "Vui lòng nhập mật khẩu";
        ok = false;
      }

      if (!ok) return;

      const users = User.getUsers();
      const nextUrl = new URLSearchParams(location.search).get("next") || "index.html";

      const user = users.find(
        (u) => u.email.toLowerCase() === inputEmail && u.password === inputPassword,
      );

      if (!user) {
        if (authMsg) {
          authMsg.textContent = "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!";
          authMsg.style.display = "block";
        }
        alert("Email hoặc mật khẩu không chính xác!");
        return;
      }

      User.set(user);
      toast(`Đăng nhập thành công! Chào mừng ${user.name}`);
      setTimeout(() => {
        location.href = nextUrl;
      }, 800);
    };
  }
}

/* ---------- KHỞI TẠO THEO TRANG ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderLayout();

  const page = document.body.dataset.page;
  const handlers = {
    home: () => {
      initSlider();
      initCountdown();
      pageHome();
    },
    list: pageList,
    detail: pageDetail,
    cart: pageCart,
    checkout: pageCheckout,
    auth: pageAuth,
  };

  if (handlers[page]) {
    handlers[page]();
  }

  // Khởi tạo các thành phần theo chuẩn bài giảng huongdanasm2
  initAddToCart();
  renderCart();
  updateCount();

  // Bắt sự kiện nút xem ưu đãi btnPromo
  const btnPromo = document.getElementById("btnPromo");
  if (btnPromo) {
    btnPromo.addEventListener("click", (e) => {
      if (btnPromo.tagName === "BUTTON") {
        e.preventDefault();
        location.href = "products.html?tag=sale";
      }
    });
  }
});
