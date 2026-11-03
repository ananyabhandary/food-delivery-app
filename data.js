'use strict';

// Sample data. Add or edit restaurants and menu items here.
// Images are emoji + gradients so the app works fully offline.
const RESTAURANTS = [
  {
    id: 'spice-route', name: 'Spice Route', cuisine: ['North Indian', 'Biryani'],
    rating: 4.5, time: 30, fee: 30, price: 2, veg: false, emoji: '🍛',
    colors: ['#ff9a3c', '#ff5a1f'], offer: '20% off up to ₹100',
    menu: [
      { id: 'sr1', cat: 'Starters', name: 'Paneer Tikka', desc: 'Char-grilled cottage cheese, mint chutney', price: 249, veg: true, emoji: '🧀' },
      { id: 'sr2', cat: 'Starters', name: 'Chicken 65', desc: 'Crispy spicy fried chicken, curry leaves', price: 279, veg: false, emoji: '🍗' },
      { id: 'sr3', cat: 'Mains', name: 'Butter Chicken', desc: 'Creamy tomato gravy, slow-cooked chicken', price: 329, veg: false, emoji: '🍛' },
      { id: 'sr4', cat: 'Mains', name: 'Dal Makhani', desc: 'Overnight black lentils, butter and cream', price: 239, veg: true, emoji: '🥘' },
      { id: 'sr5', cat: 'Biryani', name: 'Hyderabadi Chicken Biryani', desc: 'Dum-cooked basmati with raita', price: 349, veg: false, emoji: '🍚' },
      { id: 'sr6', cat: 'Biryani', name: 'Veg Dum Biryani', desc: 'Seasonal vegetables, saffron rice', price: 269, veg: true, emoji: '🍚' },
      { id: 'sr7', cat: 'Breads', name: 'Garlic Naan', desc: 'Tandoor-baked, brushed with butter', price: 69, veg: true, emoji: '🫓' },
      { id: 'sr8', cat: 'Desserts', name: 'Gulab Jamun (2 pcs)', desc: 'Warm milk dumplings in sugar syrup', price: 89, veg: true, emoji: '🍮' }
    ]
  },
  {
    id: 'pizza-corner', name: 'Pizza Corner', cuisine: ['Italian', 'Pizza'],
    rating: 4.3, time: 25, fee: 25, price: 2, veg: false, emoji: '🍕',
    colors: ['#ff6b6b', '#d62828'], offer: 'Free garlic bread over ₹499',
    menu: [
      { id: 'pc1', cat: 'Pizzas', name: 'Margherita', desc: 'Tomato, mozzarella, fresh basil', price: 249, veg: true, emoji: '🍕' },
      { id: 'pc2', cat: 'Pizzas', name: 'Farmhouse', desc: 'Capsicum, onion, mushroom, olives', price: 329, veg: true, emoji: '🍕' },
      { id: 'pc3', cat: 'Pizzas', name: 'Pepperoni Feast', desc: 'Double pepperoni, extra cheese', price: 399, veg: false, emoji: '🍕' },
      { id: 'pc4', cat: 'Pasta', name: 'Penne Arrabbiata', desc: 'Spicy tomato sauce, chilli flakes', price: 259, veg: true, emoji: '🍝' },
      { id: 'pc5', cat: 'Pasta', name: 'Chicken Alfredo', desc: 'Creamy parmesan sauce, grilled chicken', price: 319, veg: false, emoji: '🍝' },
      { id: 'pc6', cat: 'Sides', name: 'Garlic Bread', desc: 'Toasted with herb butter', price: 129, veg: true, emoji: '🥖' },
      { id: 'pc7', cat: 'Sides', name: 'Choco Lava Cake', desc: 'Molten chocolate centre', price: 109, veg: true, emoji: '🍰' }
    ]
  },
  {
    id: 'dosa-district', name: 'Dosa District', cuisine: ['South Indian', 'Breakfast'],
    rating: 4.6, time: 20, fee: 20, price: 1, veg: true, emoji: '🥞',
    colors: ['#ffd166', '#f4a300'], offer: 'Flat ₹50 off',
    menu: [
      { id: 'dd1', cat: 'Dosas', name: 'Masala Dosa', desc: 'Crisp dosa, potato masala, chutneys, sambar', price: 119, veg: true, emoji: '🥞' },
      { id: 'dd2', cat: 'Dosas', name: 'Ghee Podi Dosa', desc: 'Spiced lentil powder with ghee', price: 139, veg: true, emoji: '🥞' },
      { id: 'dd3', cat: 'Dosas', name: 'Set Dosa (3 pcs)', desc: 'Soft sponge dosas, vegetable saagu', price: 109, veg: true, emoji: '🥞' },
      { id: 'dd4', cat: 'Tiffin', name: 'Idli Vada Combo', desc: '2 idli, 1 vada, sambar, chutney', price: 99, veg: true, emoji: '🍘' },
      { id: 'dd5', cat: 'Tiffin', name: 'Bisi Bele Bath', desc: 'Hot lentil rice with ghee and boondi', price: 129, veg: true, emoji: '🍲' },
      { id: 'dd6', cat: 'Drinks', name: 'Filter Coffee', desc: 'Strong decoction, frothy milk', price: 45, veg: true, emoji: '☕' }
    ]
  },
  {
    id: 'wok-this-way', name: 'Wok This Way', cuisine: ['Chinese', 'Asian'],
    rating: 4.1, time: 35, fee: 35, price: 2, veg: false, emoji: '🥡',
    colors: ['#52b788', '#1b7f5c'], offer: '10% off on UPI',
    menu: [
      { id: 'wk1', cat: 'Starters', name: 'Veg Manchurian', desc: 'Crisp vegetable balls in tangy sauce', price: 189, veg: true, emoji: '🥟' },
      { id: 'wk2', cat: 'Starters', name: 'Chilli Chicken', desc: 'Wok-tossed with peppers and spring onion', price: 249, veg: false, emoji: '🍗' },
      { id: 'wk3', cat: 'Noodles & Rice', name: 'Hakka Noodles', desc: 'Stir-fried noodles with vegetables', price: 179, veg: true, emoji: '🍜' },
      { id: 'wk4', cat: 'Noodles & Rice', name: 'Chicken Fried Rice', desc: 'Egg, chicken, spring onion', price: 219, veg: false, emoji: '🍚' },
      { id: 'wk5', cat: 'Soups', name: 'Hot & Sour Soup', desc: 'Peppery, tangy, with mushrooms', price: 119, veg: true, emoji: '🥣' }
    ]
  },
  {
    id: 'burger-lab', name: 'Burger Lab', cuisine: ['Burgers', 'Fast Food'],
    rating: 4.2, time: 22, fee: 25, price: 1, veg: false, emoji: '🍔',
    colors: ['#f77f00', '#9c4a00'], offer: 'Buy 1 Get 1 on fries',
    menu: [
      { id: 'bl1', cat: 'Burgers', name: 'Classic Cheeseburger', desc: 'Beef-style patty, cheddar, pickles', price: 179, veg: false, emoji: '🍔' },
      { id: 'bl2', cat: 'Burgers', name: 'Crispy Veg Burger', desc: 'Crunchy veg patty, lettuce, mayo', price: 139, veg: true, emoji: '🍔' },
      { id: 'bl3', cat: 'Burgers', name: 'Spicy Chicken Burger', desc: 'Fried chicken, jalapeño, hot sauce', price: 199, veg: false, emoji: '🍔' },
      { id: 'bl4', cat: 'Sides', name: 'Loaded Fries', desc: 'Cheese sauce, peri-peri seasoning', price: 129, veg: true, emoji: '🍟' },
      { id: 'bl5', cat: 'Drinks', name: 'Chocolate Shake', desc: 'Thick, cold, extra chocolatey', price: 149, veg: true, emoji: '🥤' }
    ]
  },
  {
    id: 'green-bowl', name: 'Green Bowl', cuisine: ['Healthy', 'Salads'],
    rating: 4.4, time: 28, fee: 30, price: 3, veg: true, emoji: '🥗',
    colors: ['#95d5b2', '#2d6a4f'], offer: 'Free delivery today',
    menu: [
      { id: 'gb1', cat: 'Bowls', name: 'Quinoa Power Bowl', desc: 'Quinoa, chickpeas, avocado, tahini', price: 299, veg: true, emoji: '🥗' },
      { id: 'gb2', cat: 'Bowls', name: 'Paneer Burrito Bowl', desc: 'Brown rice, beans, grilled paneer, salsa', price: 279, veg: true, emoji: '🥙' },
      { id: 'gb3', cat: 'Salads', name: 'Greek Salad', desc: 'Cucumber, olives, feta, oregano', price: 229, veg: true, emoji: '🥒' },
      { id: 'gb4', cat: 'Drinks', name: 'Cold-Pressed Orange', desc: 'No sugar added', price: 129, veg: true, emoji: '🍊' },
      { id: 'gb5', cat: 'Drinks', name: 'Green Detox Smoothie', desc: 'Spinach, apple, cucumber, ginger', price: 149, veg: true, emoji: '🥬' }
    ]
  }
];

// Delivery free above this subtotal
const FREE_DELIVERY_ABOVE = 499;
// Valid promo codes: percent off, capped at max
const PROMOS = { WELCOME50: { percent: 50, max: 100 } };
