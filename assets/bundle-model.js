document.addEventListener('DOMContentLoaded', function () {
  const productsList = document.getElementById('products-list');
  const selectedProductsContainer = document.getElementById('selected-products');
  const totalPriceElement = document.getElementById('total-price');
  const bundleBox = document.getElementById('bundle-box-color');
  const selectionBox = document.getElementById('selection-box');
  const addToCartButton = document.getElementById('add-to-cart-button');
  const bundleTitle = document.getElementById('bundle-title');
  let selectedProducts = [];
  let numPlaceholders = 6;

  const productData = {};

  const collectionItems = document.querySelectorAll('.item');
  collectionItems.forEach((item) => {
    item.style.display = 'block';
    item.addEventListener('click', function (event) {
      event.preventDefault();
      const collectionHandle = this.getAttribute('data-collection-handle');
      const collectionName = this.getAttribute('data-collection-name');
      const backgroundColor1 = this.getAttribute('data-background-color1');
      const backgroundColor2 = this.getAttribute('data-background-color2');
      const fontColor = this.getAttribute('data-font-color');
      bundleTitle.textContent = collectionName;
      resetSelectedProducts();
      fetchProducts(collectionHandle, backgroundColor1, backgroundColor2, fontColor);
    });
  });

  function fetchProducts(collectionHandle, backgroundColor1, backgroundColor2, fontColor) {
  fetch(`/collections/${collectionHandle}/products.json`)
    .then((res) => res.json())
    .then((data) => {
      const products = data.products;
      products.forEach((p) => (productData[p.id] = p));

      productsList.innerHTML = products.map((product) => {
        const optionsHtml = product.options
          .filter((opt) => opt.values[0] !== 'Default Title')
          .map((option, index) => {
            const uniqueOptions = [...new Set(product.variants.map(v => v[`option${index + 1}`]))];
            return `
              <div class="mb-2 text-black !w-full">
                <select class="product-option-selector Readex_Pro border-2 rounded-xl border-gray-300 text-white bg-[#525252] p-1 text-black text-light" data-option-index="${index}" data-product-id="${product.id}">
                  ${uniqueOptions.map(value => `<option value="${value}">${value}</option>`).join('')}
                </select>
              </div>
            `;
          }).join('');

        return `
          <div class='product-item flex relative !bg-[#F5F5F5] p-2 rounded-2xl cursor-pointer' data-product-id="${product.id}">
            <img src="${product.images[0]?.src}" alt="${product.title}" class='py-5 w-96 h-52 md:w-56 md:h-64 xl:w-56 xl:h-42 mx-auto' style='mix-blend-mode: multiply;'>
            <div class="check-icon absolute text-center text-2xl top-2 right-2 bg-[#A3A3A3] flex justify-center items-center h-12 w-12 mx-auto text-white rounded-full p-1 hidden">
              <svg width="25" height="22" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L4.66669 8.33333L1.33336 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="product-hover-details absolute p-5 top-0 left-0 w-full h-full bg-white bg-opacity-80 flex flex-col justify-center items-center opacity-0 hover:opacity-100 hover:bg-[#000000BF] text-white transition-opacity duration-300 p-4 rounded-2xl">
              <p class="font-light text-lg mb-2 hidden md:block Readex_Pro">${product.title}</p>
              ${optionsHtml}
              <div class='w-full flex space-x-4 justify-center items-center'> 
                <p class='font-bold text-xl mt-2 price-display Readex_Pro' data-product-id="${product.id}">$${product.variants[0].price}</p>
                <button class="add-to-bundle-btn Readex_Pro bg-white text-black font-medium rounded-full ml-1 text-black px-4 py-2 mt-2" data-product-title="${product.title}"> + Add</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      productsList.classList.remove('!hidden');
      selectionBox.classList.remove('!hidden');

      // ✅ Apply correct background and font colors
      if (backgroundColor1 && backgroundColor2) {
        productsList.style.backgroundColor = backgroundColor2;
        bundleBox.style.backgroundColor = backgroundColor1;
        bundleTitle.style.color = fontColor;
      }

      document.querySelectorAll('.product-option-selector').forEach((selector) => {
        selector.addEventListener('change', function () {
          updateVariantOptions(this.getAttribute('data-product-id'));
        });
      });

      document.querySelectorAll('.add-to-bundle-btn').forEach((btn) => {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const parent = this.closest('.product-item');
          const productId = parent.getAttribute('data-product-id');
          const image = parent.querySelector('img').src;
          const selectedOptions = Array.from(parent.querySelectorAll('.product-option-selector')).map(select => select.value);
          const product = productData[productId];
          const variant = getSelectedVariant(product, selectedOptions);
          const title = this.getAttribute('data-product-title');
          addProductToBundle(
            productId,
            image,
            parseFloat(variant?.price || product.variants[0].price),
            selectedOptions,
            variant?.id || product.variants[0].id,
            title
          );
        });
      });

      updateSelectedProductsUI();
    })
    .catch((err) => console.error('Error fetching products:', err));
}


  function getSelectedVariant(product, selectedOptions) {
    return product.variants.find((variant) =>
      selectedOptions.every((opt, i) => variant[`option${i + 1}`] === opt)
    );
  }

  function updateVariantOptions(productId) {
    const item = document.querySelector(`.product-item[data-product-id="${productId}"]`);
    const product = productData[productId];
    const selectors = item.querySelectorAll('.product-option-selector');
    const selectedOptions = Array.from(selectors).map(sel => sel.value);

    selectors.forEach((selector, index) => {
      if (index > 0) {
        const prevOptions = selectedOptions.slice(0, index);
        const available = product.variants
          .filter(v => prevOptions.every((opt, i) => v[`option${i + 1}`] === opt))
          .map(v => v[`option${index + 1}`]);
        const unique = [...new Set(available)];
        const current = selector.value;
        selector.innerHTML = unique.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        selector.value = unique.includes(current) ? current : unique[0];
      }
    });

    const finalOptions = Array.from(selectors).map(sel => sel.value);
    const variant = getSelectedVariant(product, finalOptions);
    if (variant) {
      item.querySelector(`.price-display[data-product-id="${productId}"]`).textContent = `$${variant.price}`;
      item.setAttribute('data-variant-id', variant.id);
      item.setAttribute('data-product-price', variant.price);
    }
  }

  function addProductToBundle(id, image, price, options, variantId, title) {
  const product = productData[id];
  const variant = product.variants.find(v => v.id === variantId);
  const maxInventory = variant?.inventory_quantity ?? 99;

  const optionDetails = Array.isArray(product?.options) && Array.isArray(options) && product.options[0]?.name !== 'Title'
    ? product.options.map((opt, i) => `${opt.name}: ${options[i]}`)
    : [];

  const existingProductIndex = selectedProducts.findIndex(
    p => p.id === id && JSON.stringify(p.options) === JSON.stringify(options)
  );

  if (existingProductIndex !== -1) {
    selectedProducts[existingProductIndex] = { ...selectedProducts[existingProductIndex], quantity: 1, inventory: maxInventory };
  } else {
    selectedProducts.push({ id, price, options, variantId, quantity: 1, inventory: maxInventory });
  }

  updateTotalPrice();

  const productMarkup = `
    <div class='bundle-border selected-product-item flex items-center border-3 border-[#A3A3A3] p-2 rounded-2xl h-36 relative flex-shrink-0' data-product-id="${id}" data-product-options='${JSON.stringify(options)}'>
      <img src="${image}" class='w-24 h-24 xl:w-32 xl:h-32 object-contain mr-4 border border-[#A3A3A3] border-solid rounded-2xl' style='mix-blend-mode: multiply;'>
      <div class="flex flex-col justify-center w-full">
        <span class="item-price text-black font-bold ml-2 Readex_Pro">$${price.toFixed(2)}</span>
        <div class="font-medium mb-1 Readex_Pro" style="color:black;">${title}</div>
        <div class="text-sm bg-opacity-70 text-gray-600 mb-1 Readex_Pro" style="opacity: .6; color:black; line-height:1;">
          ${optionDetails.map(opt => `<div style="margin-bottom:5px;">${opt}</div>`).join('')}
        </div>
        <div class="quantity-controls flex items-center gap-4">
          <button class="decrease-qty bg-gray-300 px-2 rounded text-black font-bold">−</button>
          <span class="quantity-display mx-2 text-black font-medium Readex_Pro">1</span>
          <button class="increase-qty bg-gray-300 px-2 rounded text-black font-bold">+</button>
        </div>
      </div>
      <svg class='remove-icon rounded-full absolute top-1 right-1 w-6 h-6 cursor-pointer' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  `;

  if (existingProductIndex === -1) {
    selectedProductsContainer.insertAdjacentHTML('beforeend', productMarkup);
  }

  markProductAsSelected(id);
  attachRemoveListener();
  attachQuantityListeners();
  updatePlaceholders();
}


  function attachQuantityListeners() {
    document.querySelectorAll('.selected-product-item').forEach(parent => {
      const decreaseBtn = parent.querySelector('.decrease-qty');
      const increaseBtn = parent.querySelector('.increase-qty');
      const quantityDisplay = parent.querySelector('.quantity-display');
      const id = parent.getAttribute('data-product-id');
      const options = JSON.parse(parent.getAttribute('data-product-options'));
  
      const selectedProduct = selectedProducts.find(
        p => p.id === id && JSON.stringify(p.options) === JSON.stringify(options)
      );
      if (!selectedProduct) return;
  
      const updateQtyUI = () => {
        quantityDisplay.textContent = selectedProduct.quantity;
        parent.querySelector('.item-price').textContent = `$${(selectedProduct.price * selectedProduct.quantity).toFixed(2)}`;
        decreaseBtn.style.opacity = selectedProduct.quantity === 1 ? '0.5' : '1';
        decreaseBtn.style.cursor = selectedProduct.quantity === 1 ? 'not-allowed' : 'pointer';
      };
  
      decreaseBtn.addEventListener('click', () => {
        if (selectedProduct.quantity > 1) {
          selectedProduct.quantity -= 1;
          updateQtyUI();
          updateTotalPrice();
        }
      });
  
      increaseBtn.addEventListener('click', () => {
        selectedProduct.quantity += 1;
        updateQtyUI();
        updateTotalPrice();
      });
  
      updateQtyUI();
    });
  }

  function updateTotalPrice() {
    const total = selectedProducts.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
    totalPriceElement.textContent = `$${total.toFixed(2)}`;
  }

  function markProductAsSelected(id) {
    const item = document.querySelector(`.product-item[data-product-id="${id}"]`);
    item?.querySelector('.check-icon')?.classList.remove('hidden');
  }

  function unmarkProductAsSelected(id) {
    const item = document.querySelector(`.product-item[data-product-id="${id}"]`);
    item?.querySelector('.check-icon')?.classList.add('hidden');
  }

  function attachRemoveListener() {
    document.querySelectorAll('.remove-icon').forEach((icon) => {
      icon.onclick = (e) => {
        e.stopPropagation();
        const item = icon.closest('.selected-product-item');
        const id = item.getAttribute('data-product-id');
        const options = JSON.parse(item.getAttribute('data-product-options'));
        selectedProducts = selectedProducts.filter(p => !(p.id === id && JSON.stringify(p.options) === JSON.stringify(options)));
        item.remove();
        updateTotalPrice();
        unmarkProductAsSelected(id);
        updatePlaceholders();
      };
    });
  }

  function resetSelectedProducts() {
    selectedProducts = [];
    updateTotalPrice();
    selectedProductsContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      selectedProductsContainer.insertAdjacentHTML('beforeend', `<div class="placeholder-item h-36 w-24 xl:w-40 bg-white border-2 border-dashed border-gray-300 rounded-xl flex-shrink-0"></div>`);
    }
    numPlaceholders = 6;
  }

  function updatePlaceholders() {
    document.querySelectorAll('.placeholder-item').forEach((el) => el.remove());
    const needed = Math.max(numPlaceholders - selectedProducts.length, 0);
    for (let i = 0; i < needed; i++) {
      selectedProductsContainer.insertAdjacentHTML('beforeend', `<div class="placeholder-item h-36 w-24 xl:w-40 bg-white border-2 border-dashed border-gray-300 rounded-xl flex-shrink-0"></div>`);
    }
  }

  function updateSelectedProductsUI() {
    selectedProducts.forEach(p => markProductAsSelected(p.id));
  }

  if (addToCartButton) {
  addToCartButton.addEventListener('click', function () {
    const items = [];

    document.querySelectorAll('.selected-product-item').forEach(item => {
      const id = item.getAttribute('data-product-id');
      const options = JSON.parse(item.getAttribute('data-product-options'));
      const quantity = parseInt(item.querySelector('.quantity-display').textContent, 10) || 1;
      const product = selectedProducts.find(p => p.id === id && JSON.stringify(p.options) === JSON.stringify(options));
      if (product) {
        items.push({
          id: product.variantId,
          quantity: quantity
        });
      }
    });

    if (items.length === 0) {
      alert('Please select at least one product.');
      return;
    }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => {
        if (!res.ok) return res.text().then(text => { throw new Error(text); });
        return res.json();
      })
      .then(() => {
        window.location.href = '/cart';
      })
      .catch((err) => {
        console.error('Add to cart error:', err);
        window.location.href = '/cart';
      });
  });
}


  const firstItem = document.querySelector('.item');
  if (firstItem) {
    firstItem.click();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const popupOverlay = document.getElementById('bundle-popup-overlay');
  const closeBtn = document.getElementById('close-popup');
  const cardLinks = document.querySelectorAll('.card__whole-link_1');
  let targetLink = '';
  let popupWasOpened = false;

  cardLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      if (popupOverlay) {
        e.preventDefault();
        targetLink = link.getAttribute('href');
        popupOverlay.classList.remove('hidden');
        popupWasOpened = true;

        const firstCollection = popupOverlay.querySelector('.item');
        if (firstCollection) firstCollection.click();
      } else {
        window.location.href = link.getAttribute('href');
      }
    });
  });

  if (closeBtn && popupOverlay) {
    closeBtn.addEventListener('click', function () {
      popupOverlay.classList.add('hidden');
      if (popupWasOpened && targetLink) {
        targetLink = ''; 
      }
    });

    popupOverlay.addEventListener('click', function (e) {
      if (e.target === popupOverlay) {
        popupOverlay.classList.add('hidden');
      }
    });
  }
});
