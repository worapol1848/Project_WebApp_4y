// code in this file is written by worapol สุดหล่อ
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const LanguageContext = createContext();

export const translations = {
  en: {
    // Shared / Buttons - by worapol สุดหล่อ
    ok: 'OK',
    dismiss: 'Got it',
    login: 'Login',
    register: 'Register',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save Changes',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    total: 'Total',
    quantity: 'Quantity',
    size: 'Size',
    remove: 'Remove',
    success: 'Success',
    error: 'Error',
    username: 'Username',
    email: 'Email',
    full_name: 'Full Name',
    phone: 'Phone',
    postal_code: 'Postal Code',
    
    // Auth Modals & Alerts - by worapol สุดหล่อ
    auth_title_order: 'Sign In to Order',
    auth_msg_order: 'Please sign in or register to place an order. 😊',
    auth_title_wish: 'Wishlist',
    auth_msg_wish: 'Please sign in or register to save to wishlist. 😊',
    auth_title_comment: 'Post a Comment',
    auth_msg_comment: 'Please sign in to leave a review. 😊',

    // Navbar - by worapol สุดหล่อ
    nav_home: 'Home',
    nav_products: 'Products',
    nav_categories: 'Categories',
    nav_price: 'Price',
    nav_brands: 'Brands',
    nav_product_types: 'Product Types',
    nav_recommended: 'Recommended',
    nav_newest: 'Newest Arrivals',
    nav_popular: 'Most Popular',
    nav_promo: 'Special Promo',
    nav_min: 'Min',
    nav_max: 'Max',
    nav_search_price: 'Filter by Price',
    nav_search_placeholder: 'Search products...',
    nav_no_found: 'No products found',
    nav_my_orders: 'My Orders',
    nav_login_reg: 'Login / Register',
    nav_profile: 'Account',
    nav_logout: 'Logout',
    nav_apparel: 'Apparel',
    nav_shoes: 'Shoes',
    nav_under_5k: 'Under 5,000',
    nav_above_50k: '50,000+',

    // Home - by worapol สุดหล่อ
    h_collection: 'COLLECTION',
    h_exclusive: 'EXCLUSIVE DROP',
    h_new_coll: 'NEW COLLECTION 2026',
    h_lookbook: 'THE LOOKBOOK 2026',
    h_lookbook_desc: 'A meticulous selection of rare finds and seasonal essentials. Redefining your style with every release.',
    h_buy_now: 'Buy Now',
    h_sold_out: 'Sold Out',
    h_shop_drop: 'Shop All Products',
    h_shop_now: 'Shop now',
    h_go_home: 'Go back to Home',
    h_exclusive_drop: 'EXCLUSIVE DROP',
    h_cactus_jack: 'CACTUS JACK\nTRAVIS SCOTT',
    h_ts_desc: 'The highly anticipated Air Jordan 1 Low OG WMNS "Olive" is here. Elevate your sneaker rotation.',
    h_new_coll_2026: 'NEW COLLECTION 2026',
    h_adidas_title: 'ADIDAS ORIGINALS\nCTT JACKET',
    h_adidas_desc: 'Experience the full spectrum of our latest drop. Premium fabrics in all essential tones.',
    h_items_left: 'items left',
    h_loading_exp: 'Loading Velin Experience...',
    h_out_of_stock: 'Out of Stock',

    // Products Page - by worapol สุดหล่อ
    ps_found: 'Found',
    ps_items: 'items',
    ps_filter_by: 'Filter By',
    ps_no_products: 'No products found at the moment.',
    ps_go_back: 'Back to Shop',
    ps_all_products: 'Shop All',
    ps_featured: 'FEATURED',
    ps_premium_coll: 'Premium Collection',
    ps_desc_nike: 'Nike was founded in 1964 by Bill Bowerman and Phil Knight as "Blue Ribbon Sports" before becoming Nike in 1971. With the iconic Swoosh logo and "Just Do It" slogan, Nike has become a global leader in sports footwear and apparel, blending innovation and fashion seamlessly.',
    ps_desc_adidas: 'Adidas, the German giant founded by Adolf "Adi" Dassler in 1949 with the vision to produce the best sports shoes for athletes. Over decades, Adidas has built the "Three Stripes" legacy and become the center of streetwear culture and the sports world.',
    ps_desc_stussy: 'Stussy, the legendary brand that truly defines "Streetwear", started in the early 80s by Shawn Stussy in Laguna Beach. From a brand for surfers to a global icon that perfectly blends hip-hop, punk, and high-fashion style.',
    ps_desc_new_balance: 'New Balance was established in 1906, starting with the production of arch supports in Boston before rising to a global footwear brand known for comfort, meticulous quality, and the "Dad Shoes" design that became a worldwide trend.',
    ps_desc_asics: 'Asics was founded in 1949 by Kihachiro Onitsuka under the name Onitsuka Tiger, with the belief "Anima Sana In Corpore Sano" (A Sound Mind in a Sound Body). Asics focuses on engineering excellence for footwear to unlock athletes\' highest potential.',
    ps_desc_converse: 'Converse, founded in 1908, created a new legend in 1917 with the Chuck Taylor All-Star basketball shoe. With a timeless classic design, Converse has become a genuine symbol of street fashion, pop-punk music, and self-expression.',
    ps_desc_puma: 'Puma, founded by Rudolf Dassler in 1948 in Germany, built global fame through fast innovation and collaborations with many global icons, perfectly blending the sport lifestyle with modern fashion.',
    ps_desc_default: 'VELIN curates the finest quality products from top brands worldwide, allowing you to experience outstanding style and the latest innovations across all fashion categories, whether footwear, apparel, or accessories that reflect your true self.',

    // Product Detail - by worapol สุดหล่อ
    pd_available_sizes: 'Available Sizes',
    pd_selected: 'Selected',
    pd_available_colors: 'Available Colors',
    pd_quantity: 'Quantity',
    pd_add_to_cart: 'Add to Cart',
    pd_select_size: 'Select Size',
    pd_details: 'Product Details',
    pd_reviews: 'Reviews',
    pd_all_reviews: 'Total Reviews',
    pd_no_desc: 'No description available.',
    pd_no_reviews: 'No reviews yet.',
    pd_write_review: 'Write a Review',
    pd_shipping_info: 'Shipping Information',
    pd_auth_required: 'Login Required',
    pd_auth_msg: 'Please login to add items to your cart.',
    pd_back: 'Back',
    pd_in_stock: 'In Stock',
    pd_code: 'Code',
    pd_category: 'Category',
    pd_items_unit: 'items',
    pd_not_found: 'Product not found',
    pd_stock_limit: 'Quantity exceeds stock',
    pd_rate_error: 'Please rate before submitting',
    pd_comment_success: 'Comment submitted successfully!',

    // Cart - by worapol สุดหล่อ
    cart_title: 'Your Cart',
    cart_empty: 'Your cart is empty',
    cart_go_shop: 'Go Shopping',
    cart_summary: 'Order Summary',
    cart_subtotal: 'Subtotal',
    cart_discount: 'Product Discount',
    cart_shipping: 'Shipping',
    cart_free: 'FREE',
    cart_total: 'Total Amount',
    cart_checkout: 'Proceed to Checkout',
    cart_added: 'Added to cart',
    cart_add_success: 'Added to cart!',
    cart_remove_success: 'Removed from cart',
    
    // Wishlist - by worapol สุดหล่อ
    wish_added: 'Added to wishlist!',
    wish_removed: 'Removed from wishlist',
    wish_subtitle: 'Items you are interested in and saved.',
    wish_empty: 'No items in wishlist',
    wish_empty_desc: 'Go back and browse products you like and save them here.',

    // My Orders - by worapol สุดหล่อ
    ord_title: 'Order History',
    ord_number: 'Order',
    ord_date: 'Date',
    ord_status: 'Status',
    ord_total: 'Total Amount',
    ord_items: 'Items',
    ord_no_history: 'No order history yet.',
    ord_shop_now: 'Start Shopping',
    ord_confirm_receipt: 'Confirm Receipt',
    ord_write_review: 'Review',
    ord_reviewed: 'Reviewed',
    ord_cancel_reason: 'Cancellation Reason',
    ord_not_specified: 'Not specified',
    ord_refund_info: 'Refund Information',
    ord_refund_pending: 'Admin is processing your refund.',
    ord_refund_no_info: 'Refund info not provided.',
    ord_provide_refund: 'Provide Refund Info',
    ord_refund_done: 'Refund processed successfully.',
    ord_refund_check_bank: 'Please check your bank account.',
    
    // Order Statuses - by worapol สุดหล่อ
    st_pending: 'Pending',
    st_shipped: 'Shipped',
    st_arrived: 'Arrived',
    st_delivered: 'Delivered',
    st_cancelled: 'Cancelled',
    st_refunded: 'Refunded',

    // Confirmation Modals - by worapol สุดหล่อ
    conf_receipt_title: 'Confirm Receipt?',
    conf_receipt_msg: 'Have you received and checked the product?',
    conf_receipt_btn: 'Confirm Received',
    
    // Review Modal - by worapol สุดหล่อ
    rev_title: 'Write a Review',
    rev_rate: 'Rate this product',
    rev_placeholder: 'Share your experience with this product (Optional)',
    rev_submit: 'Submit Review',
    rev_submitting: 'Submitting...',
    rev_success: 'Thank you for your review!',

    // Refund Modal - by worapol สุดหล่อ
    ref_title: 'Refund Information',
    ref_desc: 'Please provide correct bank account details for the refund (Order #',
    ref_bank: 'Bank',
    ref_select_bank: '-- Select Bank --',
    ref_acc_name: 'Account Name',
    ref_acc_name_ph: 'Full name on account',
    ref_acc_num: 'Account Number / PromptPay',
    ref_acc_num_ph: 'Provide correct account number',
    ref_submitting: 'Saving...',
    ref_submit: 'Save Information',
    ref_success: 'Refund information saved. Admin will process it soon.',

    // Payment / Checkout - by worapol สุดหล่อ
    pay_title: 'Payment',
    pay_billing: 'Billing Information',
    pay_shipping_method: 'Shipping Method',
    pay_payment_method: 'Payment Method',
    pay_place_order: 'Place Order',
    pay_success: 'Order placed successfully!',
    pay_failed: 'Order failed',
    pay_back_cart: 'Back to Cart',
    pay_method_title: 'Payment Method',
    pay_bank_transfer: 'Bank Transfer',
    pay_bank_scb: 'Siam Commercial Bank (SCB)',
    pay_bank_kbank: 'Kasikorn Bank (K-Bank)',
    pay_bank_bbl: 'Bangkok Bank (BBL)',
    pay_bank_ktb: 'Krungthai Bank (KTB)',
    pay_bank_bay: 'Bank of Ayudhya (Krungsri)',
    pay_bank_ttb: 'TMBThanachart (ttb)',
    pay_acc_company: 'VELIN Co., Ltd.',
    pay_qr_code: 'PromptPay / QR Code',
    pay_qr_desc: 'Scan to pay',
    pay_qr_hint: 'Scan the QR code below to pay via PromptPay',
    pay_attach_slip: 'Attach slip here',
    pay_upload_slip: 'Upload Transfer Evidence',
    pay_change_slip: 'Change Image',
    pay_confirm: 'Confirm Payment',
    pay_bkk_only: 'Bangkok Only',
    pay_shipping_via: 'Shipping via',
    pay_credit_card: 'Credit / Debit Card',
    pay_summary: 'Order Summary',
    pay_missing_address: 'Please provide shipping address first',
    pay_missing_slip: 'Please attach payment slip',
    pay_select_shipping: 'Please select shipping method',

    // Profile Sections - by worapol สุดหล่อ
    prof_title: 'Account Settings',
    prof_account_info: 'Account Information',
    prof_personal: 'Personal Information',
    prof_shipping_addr: 'Shipping Address',
    
    // Profile Fields & Labels - by worapol สุดหล่อ
    prof_name: 'Full Name',
    prof_email: 'Email Address',
    prof_phone: 'Phone Number',
    prof_address: 'Shipping Address',
    prof_no_email: 'No email provided',
    prof_no_address: 'Please provide shipping address',
    
    // Profile Actions - by worapol สุดหล่อ
    prof_update: 'Update Profile',
    prof_success: 'Profile updated successfully!',
    prof_edit_address: 'Edit',
    prof_add_address: 'Add Shipping Address',
    prof_edit_address_title: 'Edit Shipping Address',

    // Password Management - by worapol สุดหล่อ
    prof_change_pw: 'Change Password',
    prof_old_pw: 'Current Password',
    prof_new_pw: 'New Password',
    prof_confirm_pw: 'Confirm New Password',
    prof_confirm_change_pw: 'Confirm Password Change',
    prof_pw_mismatch: 'New password and confirmation do not match',
    prof_pw_success: 'Password changed successfully',

    // Address & Map Specifics - by worapol สุดหล่อ
    prof_address_header: 'Address',
    prof_full_name: 'Full Name',
    prof_address_detail: 'Address Details',
    prof_address_placeholder: 'House no., Street...',
    prof_addr_detail: 'Address Detail',
    prof_addr_ph: 'House no., Street, Mooban...',
    prof_sub_district: 'Sub-district',
    prof_prov_dist_zip: 'Province / District / Postal Code',
    prof_district: 'District',
    prof_province: 'Province',
    prof_postal_code: 'Postal Code',
    prof_location_label: 'District & Province',
    prof_map_location: 'Map Location',
    prof_map_expand_hint: 'Click to expand and select map location',
    prof_map_expand: 'Expand Map',
    prof_map_title: 'Shipping Map',
    prof_coords: 'Coords',
    prof_map_confirm: 'Confirm this location',
    prof_map_pos: 'Map Position',
    prof_confirm_pos: 'Confirm selection',
    prof_set_default: 'Set as default address',
    prof_address_success: 'Shipping address updated successfully',

    // Footer - by worapol สุดหล่อ
    f_most_popular: 'Most Popular',
    f_nike: 'NIKE',
    f_apparel: 'APPAREL',
    f_popular_brands: 'Popular Brands',
    f_follow_us: 'Follow Us',
    f_sell_with: 'Sell with VELIN',
    f_about: 'About VELIN',
    f_our_story: 'Our Story',
    f_authenticity: 'Authenticity Guaranteed',
    f_store_locator: 'Store Locations',
    f_careers: 'Careers',
    f_support: 'Customer Support',
    f_contact: 'Contact Us',
    f_help: 'Help Center',
    f_faq: 'FAQ',
    f_shipping_info: 'Shipping Information',
    f_copyright: '2026 Copyright | VELIN',
    f_terms: 'Terms',
    f_privacy: 'Privacy',
    f_tagline: 'The Premier Destination for Curation & Rare Finds.',
    
    // Shipping Modal Content - by worapol สุดหล่อ
    ship_title: 'Shipping & Delivery',
    ship_messenger_title: 'Messenger Delivery (Bangkok Only)',
    ship_messenger_desc: 'Fast delivery via courier after product verification. Same-day delivery available for ready-to-ship orders confirmed before 04:00 PM. (Fee calculated by distance)',
    ship_ems_title: 'EMS Express',
    ship_ems_desc: 'Standard delivery via logistics partners after verification (1-2 business days for ready-to-ship, 3-5 days for standard orders).',

    // Admin - by worapol สุดหล่อ
    adm_dashboard: 'Dashboard',
    adm_products: 'Products',
    adm_orders: 'Orders',
    adm_revenue: 'Revenue',
    adm_bestsellers: 'Best Sellers',
    adm_logs: 'Activity Logs',
    adm_personnel: 'Personnel System',
    adm_manage: 'Manage Admins',
    adm_sales_dash: 'Sales Dashboard',
    adm_inventory_summary: 'Inventory Summary',
    adm_sales_by_brand: 'Sales by Brand',
    adm_top_brand: 'Top Performing Brand',
    adm_no_brand_data: 'No brand data available.',
    
    // Admin Inventory - by worapol สุดหล่อ
    inv_title: 'Product Inventory & Summary',
    inv_th_product: 'Product',
    inv_th_sold: 'Sold Revenue (฿)',
    inv_th_sold_qty: 'Sold (Qty)',
    inv_th_remain: 'Stock Value (฿)',
    inv_th_remain_qty: 'Remaining (Qty)',
    inv_th_total_qty: 'Total Quantity',
    inv_th_total_val: 'Grand Total (Sold + Remaining)',
    inv_th_price: 'Price',

    // Admin Orders - by worapol สุดหล่อ
    adm_order_shipped: 'Order marked as shipped',
    adm_order_arrived: 'Order arrived at destination',
    adm_order_cancelled: 'Order cancelled successfully',
    adm_order_refunded: 'Order marked as Refunded',
    adm_order_fetch_failed: 'Failed to fetch order details',
    adm_order_update_failed: 'Failed to update order',
    adm_slip_verified: 'Slip verified',
    adm_slip_unverified: 'Slip unverified',
    adm_slip_update_failed: 'Failed to update slip status',
    adm_manage_orders: 'Manage Customer Orders',
    adm_pay_verify: 'Payment Verification',
    adm_ship_status: 'Shipping Status',
    adm_order_id: 'Order ID',
    adm_customer: 'Customer',
    adm_date: 'Date',
    adm_total: 'Total',
    adm_status: 'Status',
    adm_slip_check: 'Slip Check',
    adm_actions: 'Actions',
    adm_no_orders: 'No orders found matching your filters.',
    adm_order_details: 'Order Details',
    adm_cust_info: 'Customer & Shipping Info',
    adm_items: 'Items',
    adm_total_pay: 'Total Pay',
    adm_curr_status: 'Current Status',
    adm_reason: 'Reason',
    adm_wait_confirm: 'Waiting for customer to confirm receipt',
    adm_finalized: 'Finalized',
    adm_refund_success: 'Refund Success',
    adm_confirm_ship: 'Confirm Shipping',
    adm_confirm_ship_msg: 'Do you want to change status to "Shipped"?',
    adm_confirm_arrived: 'Confirm Arrival',
    adm_confirm_arrived_msg: 'Do you want to notify that products have arrived at destination?',
    adm_cancel_order: 'Cancel Order',
    adm_cancel_reason_ph: 'e.g. Out of stock, Incorrect info...',
    adm_cancel_notice: 'Notification will be sent to customer',
    adm_confirm_refund: 'Confirm Refund',
    adm_confirm_refund_msg: 'Have you already transferred the refund?',
    adm_map_expand: 'Expand Map',
    adm_no_coords: 'Coordinates not found (Customer not pinned)',
    adm_coords: 'Coords',
    adm_slip_view_hint: 'Click to view slip',
    adm_verified_hint: 'Verified',
    adm_pending_hint: 'Pending Check',
    adm_no_slip: 'No Slip',
    adm_map_pos_label: 'Map Location',

    // Navigation & General - by worapol สุดหล่อ
    view_detail: 'View Detail',
    nav_wishlist: 'Wishlist',
    nav_under: 'Under',
    nav_up: 'Up',
    nav_user_acc: 'User Account',

    // Auth Page - by worapol สุดหล่อ
    auth_welcome: 'Welcome Back',
    auth_sign_in_desc: 'Sign in to your account',
    auth_create_acc: 'Create Account',
    auth_join_desc: 'Join Velin Inventory System',
    auth_username: 'Username',
    auth_password: 'Password',
    auth_confirm_password: 'Confirm Password',
    auth_email: 'Email',
    auth_register_now: 'Register now',
    auth_already_acc: 'Already have an account?',
    auth_sign_in: 'Sign In',
    auth_register: 'Register',
    auth_back_home: 'Back to Website',
    auth_dont_have_acc: "Don't have an account?",
    auth_login_success: 'Welcome back',
    auth_reg_success: 'Registration successful! Please login.',
    auth_pass_mismatch: 'Passwords do not match',
    auth_conn_error: 'Connection error',
    auth_login_failed: 'Login failed',
    auth_reg_failed: 'Registration failed',

    // Misc / Filters - by worapol สุดหล่อ
    en: 'English',
    th: 'Thai',
    in: 'in',
    cm: 'cm',
    '2d': '2D',
    brand: 'Brand',
    type: 'Type',
    category: 'Category',
    sort: 'Sort',
    sale: 'Sale',
    cart_shipping_pending: 'TBD (Enter address)',

    // Super Admin - by worapol สุดหล่อ
    super_admin_welcome: 'Welcome!',
    super_admin_desc_1: 'You are logged in as',
    super_admin_desc_2: 'Please select the system you want to access:',
    super_admin_btn_products: 'Manage Products / Orders (Normal)',
    super_admin_btn_admins: 'Manage Admins (Face Scan Required)',
  },
  th: {
    // Shared / Buttons - by worapol สุดหล่อ
    ok: 'ตกลง',
    dismiss: 'รับทราบ',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    save: 'บันทึกการเปลี่ยนแปลง',
    back: 'กลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    loading: 'กำลังโหลด...',
    total: 'ทั้งหมด',
    quantity: 'จำนวน',
    size: 'ไซส์',
    remove: 'ลบออก',
    success: 'สำเร็จ',
    error: 'เกิดข้อผิดพลาด',
    username: 'ชื่อผู้ใช้',
    email: 'อีเมล',
    full_name: 'ชื่อ-นามสกุล',
    phone: 'เบอร์โทรศัพท์',
    postal_code: 'รหัสไปรษณีย์',

    // Auth Modals & Alerts - by worapol สุดหล่อ
    auth_title_order: 'เข้าสู่ระบบเพื่อสั่งซื้อ',
    auth_msg_order: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนสั่งซื้อสินค้านะครับ 😊',
    auth_title_wish: 'รายการโปรด',
    auth_msg_wish: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อบันทึกรายการโปรดนะครับ 😊',
    auth_title_comment: 'แสดงความคิดเห็น',
    auth_msg_comment: 'กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็นนะครับ 😊',

    // Navbar - by worapol สุดหล่อ
    nav_home: 'หน้าหลัก',
    nav_products: 'สินค้า',
    nav_categories: 'หมวดหมู่',
    nav_price: 'ราคา',
    nav_brands: 'แบรนด์',
    nav_product_types: 'ประเภทสินค้า',
    nav_recommended: 'สินค้าแนะนำ',
    nav_newest: 'สินค้าใหม่ล่าสุด',
    nav_popular: 'ยอดนิยม',
    nav_promo: 'โปรโมชั่นพิเศษ',
    nav_min: 'ต่ำสุด',
    nav_max: 'สูงสุด',
    nav_search_price: 'ค้นหาตามราคา',
    nav_search_placeholder: 'ค้นหาสินค้า...',
    nav_no_found: 'ไม่พบสินค้า',
    nav_my_orders: 'ประวัติการสั่งซื้อ',
    nav_login_reg: 'เข้าสู่ระบบ / สมัครสมาชิก',
    nav_profile: 'บัญชี',
    nav_logout: 'ออกจากระบบ',
    nav_apparel: 'เสื้อผ้า',
    nav_shoes: 'รองเท้า',
    nav_under_5k: 'ต่ำกว่า 5,000',
    nav_above_50k: '50,000 ขึ้นไป',

    // Home - by worapol สุดหล่อ
    h_collection: 'คอลเลกชัน',
    h_exclusive: 'สินค้าพิเศษ',
    h_new_coll: 'คอลเลกชันใหม่ 2026',
    h_lookbook: 'THE LOOKBOOK 2026',
    h_lookbook_desc: 'คัดสรรสินค้าหายากและคอลเลกชันล่าสุด เพื่อนิยามสไตล์ใหม่ในแบบคุณ',
    h_buy_now: 'ซื้อตอนนี้',
    h_sold_out: 'สินค้าหมด',
    h_shop_drop: 'ดูสินค้าทั้งหมด',
    h_shop_now: 'ช้อปเลย',
    h_exclusive_drop: 'เปิดตัวสุดเอ็กซ์คลูซีฟ',
    h_cactus_jack: 'CACTUS JACK\nTRAVIS SCOTT',
    h_ts_desc: 'การเปิดตัว Air Jordan 1 Low OG WMNS "Olive" ที่รอคอยมาถึงแล้ว ยกระดับสไตล์ของคุณเลย',
    h_new_coll_2026: 'คอลเลกชันใหม่ 2026',
    h_adidas_title: 'ADIDAS ORIGINALS\nCTT JACKET',
    h_adidas_desc: 'สัมผัสคอลเลกชันล่าสุดของเรา ด้วยเนื้อผ้าพรีเมียมในโทนสีที่ทุกคนต้องมี',
    h_items_left: 'รายการสุดท้าย',
    h_loading_exp: 'กำลังโหลดประสบการณ์ Velin...',
    h_go_home: 'กลับหน้าหลัก',

    // Products Page - by worapol สุดหล่อ
    ps_found: 'พบสินค้า',
    ps_items: 'รายการ',
    ps_filter_by: 'กรองโดย',
    ps_no_products: 'ไม่พบสินค้าที่คุณต้องการในขณะนี้',
    ps_go_back: 'กลับไปหน้าขาย',
    ps_all_products: 'สินค้าทั้งหมด',
    ps_featured: 'สินค้าแนะนำ',
    ps_premium_coll: 'คอลเลกชันพรีเมียม',
    ps_desc_nike: 'Nike (ไนกี้) ก่อตั้งในปี 1964 โดย Bill Bowerman และ Phil Knight ในฐานะ \'Blue Ribbon Sports\' ก่อนจะเปลี่ยนชื่อเป็น Nike ในปี 1971 ด้วยสัญลักษณ์ Swoosh อันเป็นเอกลักษณ์และสโลแกน \'Just Do It\' ไนกี้ได้กลายเป็นผู้นำระดับโลกด้านรองเท้าและเครื่องแต่งกายกีฬาที่ผสมผสานนวัตกรรมและแฟชั่นเข้าด้วยกันอย่างลงตัว',
    ps_desc_adidas: 'Adidas (อาดิดาส) ยักษ์ใหญ่จากเยอรมัน ก่อตั้งโดย Adolf \'Adi\' Dassler ในปี 1949 ด้วยวิสัยทัศน์ที่ต้องการผลิตรองเท้ากีฬาที่ดีที่สุดสำหรับนักกีฬา ตลอดหลายทศวรรษที่ผ่านมา อาดิดาสได้สร้างตำนาน \'Three Stripes\' และกลายเป็นศูนย์กลางของวัฒนธรรมสตรีทแวร์และวงการกีฬาโลก',
    ps_desc_stussy: 'Stussy (สตุสซี่) แบรนด์ระดับตำนานที่นิยามคำว่า \'Streetwear\' อย่างแท้จริง เริ่มต้นขึ้นในช่วงต้นยุค 80 โดย Shawn Stussy ในย่าน Laguna Beach จากแบรนด์สำหรับชาวเซิร์ฟสู่ไอคอนระดับโลกที่ผสมผสานวัฒนธรรมฮิปฮอป พังก์ และสไตล์ไฮแฟชั่นเข้าด้วยกันอย่างลงตัว',
    ps_desc_new_balance: 'New Balance ก่อตั้งในปี 1906 โดยเริ่มต้นจากการผลิตอุปกรณ์พยุงอุ้งเท้า (Arch Supports) ในบอสตัน ก่อนจะก้าวขึ้นเป็นแบรนด์รองเท้าระดับโลกที่ขึ้นชื่อเรื่องความสบาย คุณภาพการผลิตที่พิถีพิถัน และดีไซน์แบบ \'Dad Shoes\' ที่กลายเป็นเทรนด์ยอดฮิตทั่วโลก',
    ps_desc_asics: 'Asics ก่อตั้งในปี 1949 โดย Kihachiro Onitsuka ภายใต้ชื่อ Onitsuka Tiger ด้วยความเชื่อที่ว่า \'จิตใจที่แจ่มใสอยู่ในร่างกายที่แข็งแรง\' (Anima Sana In Corpore Sano) เอสิกส์จึงมุ่งเน้นความเป็นเลิศทางวิศวกรรมเพื่อรองเท้าที่ช่วยปลดล็อกศักยภาพสูงสุดของนักกีฬา',
    ps_desc_converse: 'Converse (คอนเวิร์ส) ก่อตั้งขึ้นในปี 1908 และสร้างตำนานบทใหม่ในปี 1917 ด้วยรองเท้าบาสเกตบอล Chuck Taylor All-Star ด้วยดีไซน์คลาสสิกที่ก้าวข้ามกาลเวลา คอนเวิร์สจึงกลายเป็นสัญลักษณ์ของสตรีทแฟชั่น ดนตรีป๊อปพังก์ และการแสดงออกถึงตัวตนอย่างแท้จริง',
    ps_desc_puma: 'Puma ก่อตั้งโดย Rudolf Dassler ในปี 1948 ณ ประเทศเยอรมัน พูม่าสร้างชื่อเสียงระดับโลกผ่านนวัตกรรมที่รวดเร็วและความร่วมมือกับไอคอนระดับโลกมากมาย ผสมผสานไลฟ์สไตล์แบบสปอร์ตเข้ากับแฟชั่นยุคใหม่ได้อย่างลงตัว',
    ps_desc_default: 'VELIN คัดสรรผลิตภัณฑ์คุณภาพเยี่ยมจากแบรนด์ชั้นนำทั่วโลก เพื่อให้คุณได้สัมผัสกับสไตล์ที่โดดเด่นและนวัตกรรมล่าสุดในวงการแฟชั่นทุกประเภท ไม่ว่าจะเป็นรองเท้า เสื้อผ้า หรืออุปกรณ์เสริมที่สะท้อนความเป็นตัวคุณ',

    // Product Detail - by worapol สุดหล่อ
    pd_available_sizes: 'ไซส์ที่พร้อมส่ง',
    pd_selected: 'เลือกแล้ว',
    pd_available_colors: 'สีอื่นๆ ที่มี',
    pd_quantity: 'จำนวน',
    pd_add_to_cart: 'เพิ่มลงตะกร้า',
    pd_select_size: 'เลือกไซส์',
    pd_details: 'รายละเอียดสินค้า',
    pd_reviews: 'รีวิวสินค้า',
    pd_all_reviews: 'รีวิวทั้งหมด',
    pd_no_desc: 'ยังไม่มีรายละเอียดสินค้า',
    pd_no_reviews: 'ยังไม่มีรีวิวสำหรับสินค้านี้',
    pd_write_review: 'เขียนรีวิว',
    pd_shipping_info: 'ข้อมูลการจัดส่ง',
    pd_auth_required: 'จำเป็นต้องเข้าสู่ระบบ',
    pd_auth_msg: 'กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงตะกร้า',
    pd_back: 'กลับ',
    pd_in_stock: 'มีสินค้า',
    pd_code: 'รหัสสินค้า',
    pd_category: 'หมวดหมู่',
    pd_items_unit: 'ชิ้น',
    pd_not_found: 'ไม่พบสินค้า',
    pd_stock_limit: 'จำนวนสินค้าเกินสต็อกที่มีอยู่',
    pd_rate_error: 'กรุณาให้คะแนนดาวก่อนส่งรีวิว',
    pd_comment_success: 'ส่งความคิดเห็นเรียบร้อยแล้ว!',

    // Cart - by worapol สุดหล่อ
    cart_title: 'ตะกร้าสินค้าของคุณ',
    cart_empty: 'ตะกร้าของคุณยังว่างอยู่',
    cart_go_shop: 'ไปเลือกซื้อสินค้า',
    cart_summary: 'สรุปยอดคำสั่งซื้อ',
    cart_subtotal: 'ยอดรวมสินค้า',
    cart_discount: 'ส่วนลดสินค้า',
    cart_shipping: 'ค่าจัดส่ง',
    cart_free: 'ฟรี',
    cart_total: 'ยอดสุทธิ',
    cart_checkout: 'ดำเนินการชำระเงิน',
    cart_added: 'เพิ่มลงตะกร้าแล้ว',
    cart_add_success: 'เพิ่มลงตะกร้าแล้ว!',
    cart_remove_success: 'เอาสินค้าออกจากตะกร้าแล้ว',

    // Wishlist - by worapol สุดหล่อ
    wish_added: 'เพิ่มรายการโปรดแล้ว!',
    wish_removed: 'นำออกจากรายการโปรดแล้ว',
    wish_subtitle: 'สินค้าที่คุณสนใจและบันทึกไว้',
    wish_empty: 'ไม่มีรายการโปรด',
    wish_empty_desc: 'กลับไปเลือกชมสินค้าที่คุณถูกใจแล้วบันทึกไว้ที่นี่',

    // My Orders - by worapol สุดหล่อ
    ord_title: 'ประวัติการสั่งซื้อ',
    ord_number: 'คำสั่งซื้อ',
    ord_date: 'วันที่',
    ord_status: 'สถานะ',
    ord_total: 'ราคารวม',
    ord_items: 'รายการ',
    ord_no_history: 'ยังไม่มีประวัติการสั่งซื้อ',
    ord_shop_now: 'เลือกซื้อสินค้าเลย',
    ord_confirm_receipt: 'ยืนยันการรับสินค้า',
    ord_write_review: 'เขียนรีวิว',
    ord_reviewed: 'รีวิวแล้ว',
    ord_cancel_reason: 'เหตุผลที่ยกเลิก',
    ord_not_specified: 'ไม่ได้ระบุเหตุผล',
    ord_refund_info: 'ข้อมูลการคืนเงิน',
    ord_refund_pending: 'แอดมินกำลังดำเนินการคืนเงินให้ท่าน',
    ord_refund_no_info: 'ยังไม่ได้แจ้งข้อมูลคืนเงิน',
    ord_provide_refund: 'แจ้งข้อมูลคืนเงิน',
    ord_refund_done: 'คืนเงินเรียบร้อยแล้ว',
    ord_refund_check_bank: 'กรุณาตรวจสอบยอดเงินในบัญชี',
    
    // Order Statuses - by worapol สุดหล่อ
    st_pending: 'รอดำเนินการ',
    st_shipped: 'จัดส่งแล้ว',
    st_arrived: 'ถึงที่หมาย',
    st_delivered: 'สำเร็จแล้ว',
    st_cancelled: 'ยกเลิก',
    st_refunded: 'คืนเงินแล้ว',

    // Confirmation Modals - by worapol สุดหล่อ
    conf_receipt_title: 'ยืนยันได้รับสินค้า?',
    conf_receipt_msg: 'คุณตรวจสอบและได้รับสินค้าเรียบร้อยแล้วใช่หรือไม่?',
    conf_receipt_btn: 'ยืนยันรับของ',
    
    // Review Modal - by worapol สุดหล่อ
    rev_title: 'เขียนรีวิวสินค้า',
    rev_rate: 'ให้คะแนนสินค้านี้',
    rev_placeholder: 'แชร์ประสบการณ์ของคุณเกี่ยวกับสินค้านี้ (ไม่บังคับ)',
    rev_submit: 'ส่งรีวิว',
    rev_submitting: 'กำลังส่ง...',
    rev_success: 'ขอบคุณสำหรับรีวิวของคุณ!',

    // Refund Modal - by worapol สุดหล่อ
    ref_title: 'แจ้งข้อมูลเพื่อรับเงินคืน',
    ref_desc: 'กรุณากรอกข้อมูลบัญชีธนาคารเพื่อให้เราโอนเงินคืน (ออเดอร์ #',
    ref_bank: 'ธนาคาร',
    ref_select_bank: '-- เลือกธนาคาร --',
    ref_acc_name: 'ชื่อบัญชี',
    ref_acc_name_ph: 'ชื่อ-นามสกุลเจ้าของบัญชี',
    ref_acc_num: 'เลขบัญชี / เบอร์พร้อมเพย์',
    ref_acc_num_ph: 'ระบุเลขบัญชีที่ถูกต้อง',
    ref_submitting: 'กำลังบันทึก...',
    ref_submit: 'บันทึกข้อมูล',
    ref_success: 'บันทึกข้อมูลคืนเงินเรียบร้อยแล้ว',

    // Payment / Checkout - by worapol สุดหล่อ
    pay_title: 'ชำระเงิน',
    pay_billing: 'ข้อมูลที่อยู่จัดส่ง',
    pay_shipping_method: 'วิธีการจัดส่ง',
    pay_payment_method: 'วิธีการชำระเงิน',
    pay_place_order: 'ยืนยันการสั่งซื้อ',
    pay_success: 'สั่งซื้อสินค้าสำเร็จ!',
    pay_failed: 'การสั่งซื้อล้มเหลว',
    pay_back_cart: 'กลับไปตะกร้า',
    pay_method_title: 'วิธีการชำระเงิน',
    pay_bank_transfer: 'โอนเงินผ่านธนาคาร',
    pay_bank_scb: 'ธนาคารไทยพาณิชย์ (SCB)',
    pay_bank_kbank: 'ธนาคารกสิกรไทย (K-Bank)',
    pay_bank_bbl: 'ธนาคารกรุงเทพ (BBL)',
    pay_bank_ktb: 'ธนาคารกรุงไทย (KTB)',
    pay_bank_bay: 'ธนาคารกรุงศรีอยุธยา (Krungsri)',
    pay_bank_ttb: 'ทหารไทยธนชาต (ttb)',
    pay_acc_company: 'บริษัท เวลิน จำกัด (VELIN Co., Ltd.)',
    pay_qr_code: 'พร้อมเพย์ / QR Code',
    pay_qr_desc: 'สแกนเพื่อชำระเงิน',
    pay_qr_hint: 'สแกน QR Code ด้านล่างเพื่อชำระเงินผ่าน PromptPay',
    pay_attach_slip: 'แนบสลิปที่นี่',
    pay_upload_slip: 'อัพโหลดหลักฐานการโอน',
    pay_change_slip: 'เปลี่ยนรูปภาพ',
    pay_confirm: 'ยืนยันการชำระเงิน',
    pay_bkk_only: 'เฉพาะกรุงเทพฯ',
    pay_shipping_via: 'การจัดส่งผ่าน',
    pay_credit_card: 'บัตรเครดิต/เดบิต',

    // Profile Sections - by worapol สุดหล่อ
    prof_title: 'การตั้งค่าบัญชี',
    prof_account_info: 'ข้อมูลบัญชี',
    prof_personal: 'ข้อมูลส่วนตัว',
    prof_shipping_addr: 'ที่อยู่จัดส่ง',
    
    // Profile Fields & Labels - by worapol สุดหล่อ
    prof_name: 'ชื่อ-นามสกุล',
    prof_email: 'อีเมล',
    prof_phone: 'เบอร์โทรศัพท์',
    prof_address: 'ที่อยู่สำหรับจัดส่ง',
    prof_no_email: 'ไม่ได้ระบุอีเมล',
    prof_no_address: 'กรุณาระบุที่อยู่จัดส่ง',
    
    // Profile Actions - by worapol สุดหล่อ
    prof_update: 'อัปเดตข้อมูล',
    prof_success: 'อัปเดตข้อมูลโปรไฟล์แล้ว!',
    prof_edit_address: 'แก้ไข',
    prof_add_address: 'เพิ่มที่อยู่จัดส่ง',
    prof_edit_address_title: 'แก้ไขที่อยู่จัดส่ง',

    // Password Management - by worapol สุดหล่อ
    prof_change_pw: 'เปลี่ยนรหัสผ่าน',
    prof_old_pw: 'รหัสผ่านปัจจุบัน',
    prof_new_pw: 'รหัสผ่านใหม่',
    prof_confirm_pw: 'ยืนยันรหัสผ่านใหม่',
    prof_confirm_change_pw: 'ยืนยันการเปลี่ยนรหัสผ่าน',
    prof_pw_mismatch: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน',
    prof_pw_success: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',

    // Address & Map Specifics - by worapol สุดหล่อ
    prof_address_header: 'ที่อยู่',
    prof_full_name: 'ชื่อ นามสกุล',
    prof_address_detail: 'รายละเอียดที่อยู่',
    prof_address_placeholder: 'บ้านเลขที่, ถนน...',
    prof_addr_detail: 'รายละเอียดที่อยู่',
    prof_addr_ph: 'บ้านเลขที่, ถนน, หมู่บ้าน...',
    prof_sub_district: 'แขวง / ตำบล',
    prof_prov_dist_zip: 'จังหวัด / เขต / รหัสไปรษณีย์',
    prof_district: 'เขต / อำเภอ',
    prof_province: 'จังหวัด',
    prof_postal_code: 'รหัสไปรษณีย์',
    prof_location_label: 'เขตและจังหวัด',
    prof_map_location: 'ตำแหน่งบนแผนที่',
    prof_map_expand_hint: 'คลิกเพื่อขยายและเลือกตำแหน่งแผนที่',
    prof_map_expand: 'ขยายแผนที่',
    prof_map_title: 'แผนที่จัดส่ง',
    prof_coords: 'พิกัด',
    prof_map_confirm: 'ยืนยันตำแหน่งนี้',
    prof_map_pos: 'ตำแหน่งบนแผนที่',
    prof_confirm_pos: 'ยืนยันตำแหน่งนี้',
    prof_set_default: 'ตั้งเป็นที่อยู่หลัก',
    prof_address_success: 'อัปเดตที่อยู่จัดส่งเรียบร้อย',

    // Footer - by worapol สุดหล่อ
    f_most_popular: 'สินค้าขายดี',
    f_nike: 'NIKE',
    f_apparel: 'เครื่องแต่งกาย',
    f_popular_brands: 'แบรนด์ยอดนิยม',
    f_follow_us: 'ติดตามเรา',
    f_sell_with: 'ขายกับ VELIN',
    f_about: 'เกี่ยวกับ VELIN',
    f_our_story: 'เรื่องราวของเรา',
    f_authenticity: 'รับประกันของแท้',
    f_store_locator: 'ที่ตั้งสาขา',
    f_careers: 'ร่วมงานกับเรา',
    f_support: 'ช่วยเหลือลูกค้า',
    f_contact: 'ติดต่อเรา',
    f_help: 'ศูนย์ช่วยเหลือ',
    f_faq: 'คำถามที่พบบ่อย',
    f_shipping_info: 'ข้อมูลการจัดส่ง',
    f_copyright: '2026 ลิขสิทธิ์ | VELIN',
    f_terms: 'ข้อกำหนด',
    f_privacy: 'ความเป็นส่วนตัว',

    // Shipping Modal - by worapol สุดหล่อ
    ship_title: 'การจัดส่งและขนส่ง',
    ship_messenger_title: 'จัดส่งเมสเซนเจอร์ (เฉพาะกรุงเทพฯ)',
    ship_messenger_desc: 'จัดส่งด่วนหลังการตรวจสอบสินค้า เลือกส่งในวันเดียวกันได้สำหรับคำสั่งซื้อพร้อมส่งที่ยืนยันก่อน 16:00 น. (ราคาตามระยะทาง)',
    ship_ems_title: 'ส่งแบบ EMS ด่วน',
    ship_ems_desc: 'จัดส่งโดยพาร์ทเนอร์หลังผ่านการตรวจสอบ (1-2 วันทำการสำหรับสินค้าพร้อมส่ง, 3-5 วันสำหรับเคสปกติ)',

    // Admin - by worapol สุดหล่อ
    adm_dashboard: 'แดชบอร์ด',
    adm_products: 'จัดการสินค้า',
    adm_orders: 'รายการสั่งซื้อ',
    adm_revenue: 'รายได้',
    adm_bestsellers: 'สินค้าขายดี',
    adm_logs: 'ประวัติการใช้งาน',
    adm_personnel: 'ระบบบุคลากร',
    adm_manage: 'จัดการแอดมิน',
    adm_sales_dash: 'หน้าขายสินค้า',
    adm_inventory_summary: 'สรุปคลังสินค้า',
    adm_sales_by_brand: 'ยอดขายตามแบรนด์',
    adm_top_brand: 'แบรนด์ที่ทำยอดขายได้สูงสุด',
    adm_no_brand_data: 'ไม่มีข้อมูลแบรนด์',
    
    // Admin Inventory - by worapol สุดหล่อ
    inv_title: 'สรุปผลิตภัณฑ์และคลังสินค้า',
    inv_th_product: 'สินค้า',
    inv_th_sold: 'รายได้จากการขาย (฿)',
    inv_th_sold_qty: 'ขายแล้ว (ชิ้น)',
    inv_th_remain: 'มูลค่าสต็อกคงเหลือ (฿)',
    inv_th_remain_qty: 'เหลืออยู่ในสต็อก (ชิ้น)',
    inv_th_total_qty: 'จำนวนรวมทั้งหมด (ชิ้น)',
    inv_th_total_val: 'มูลค่าสินค้ารวมทั้งหมด (ขายแล้ว + ยังอยู่)',
    inv_th_price: 'ราคาต่อชิ้น',

    // Admin Orders - by worapol สุดหล่อ
    adm_order_shipped: 'แจ้งจัดส่งสินค้าเรียบร้อยแล้ว',
    adm_order_arrived: 'แจ้งสินค้าถึงที่หมายเรียบร้อยแล้ว',
    adm_order_cancelled: 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว',
    adm_order_refunded: 'คืนเงินเรียบร้อยแล้ว',
    adm_order_fetch_failed: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้',
    adm_order_update_failed: 'ไม่สามารถอัปเดตสถานะออเดอร์ได้',
    adm_slip_verified: 'ตรวจสอบสลิปเรียบร้อยแล้ว',
    adm_slip_unverified: 'ยกเลิกการตรวจสอบสลิป',
    adm_slip_update_failed: 'ไม่สามารถอัปเดตสถานะสลิปได้',
    adm_manage_orders: 'จัดการรายการสั่งซื้อจากลูกค้า',
    adm_pay_verify: 'ตรวจสอบการชำระเงิน',
    adm_ship_status: 'สถานะการจัดส่ง',
    adm_order_id: 'เลขออเดอร์',
    adm_customer: 'ลูกค้า',
    adm_date: 'วันที่',
    adm_total: 'ยอดรวม',
    adm_status: 'สถานะ',
    adm_slip_check: 'ตรวจสลิป',
    adm_actions: 'จัดการ',
    adm_no_orders: 'ไม่พบรายการที่ตรงตามที่เลือก',
    adm_order_details: 'รายละเอียดคำสั่งซื้อ',
    adm_cust_info: 'ข้อมูลลูกค้าและที่อยู่จัดส่ง',
    adm_items: 'รายการสินค้า',
    adm_total_pay: 'ยอดชำระรวม',
    adm_curr_status: 'สถานะปัจจุบัน',
    adm_reason: 'เหตุผล',
    adm_wait_confirm: 'รอการยืนยันรับสินค้าจากลูกค้า',
    adm_finalized: 'เสร็จสมบูรณ์',
    adm_refund_success: 'คืนเงินสำเร็จ',
    adm_confirm_ship: 'ยืนยันการจัดส่ง',
    adm_confirm_ship_msg: 'คุณต้องการเปลี่ยนสถานะเป็น "จัดส่งแล้ว" ใช่หรือไม่?',
    adm_confirm_arrived: 'ยืนยันสินค้าถึงที่หมาย',
    adm_confirm_arrived_msg: 'คุณต้องการแจ้งว่าสินค้าถึงพิกัดที่หมายแล้วใช่หรือไม่?',
    adm_cancel_order: 'ยกเลิกคำสั่งซื้อ',
    adm_cancel_reason_ph: 'เช่น สินค้าหมด, ข้อมูลไม่ถูกต้อง...',
    adm_cancel_notice: 'ระบบจะส่งข้อความแจ้งเตือนเหตุผลนี้ให้ลูกค้าทราบ',
    adm_confirm_refund: 'ยืนยันการคืนเงินสำเร็จ',
    adm_confirm_refund_msg: 'คุณได้ทำการโอนเงินคืนให้ลูกค้าแล้วใช่หรือไม่?',
    adm_map_expand: 'ขยายแผนที่',
    adm_no_coords: 'ไม่พบข้อมูลพิกัดบนแผนที่ (ลูกค้ายังไม่ได้ปักหมุดที่อยู่)',
    adm_coords: 'พิกัด',
    adm_slip_view_hint: 'ส่องดูรูปสลิป',
    adm_verified_hint: 'อนุมัติแล้ว',
    adm_pending_hint: 'รอยืนยัน',
    adm_no_slip: 'ไม่มีสลิป',
    adm_map_pos_label: 'ตำแหน่งบนแผนที่',
    view_detail: 'ดูรายละเอียด',
    nav_wishlist: 'รายการโปรด',
    nav_under: 'ต่ำกว่า',
    nav_up: 'ขึ้นไป',
    nav_user_acc: 'บัญชีผู้ใช้',
    h_out_of_stock: 'สินค้าหมด',
    pay_summary: 'สรุปคำสั่งซื้อ',
    pay_missing_address: 'กรุณากรอกที่อยู่จัดส่งก่อนชำระเงิน',
    pay_missing_slip: 'กรุณาแนบสลิปหลักฐานการโอน',
    pay_select_shipping: 'กรุณาเลือกวิธีการจัดส่ง',

    // Auth Page (Synced) - by worapol สุดหล่อ
    auth_welcome: 'ยินดีต้อนรับกลับมา',
    auth_sign_in_desc: 'เข้าสู่ระบบบัญชีของคุณ',
    auth_create_acc: 'สร้างบัญชี',
    auth_join_desc: 'เข้าร่วมระบบ Velin Inventory',
    auth_username: 'ชื่อผู้ใช้',
    auth_password: 'รหัสผ่าน',
    auth_confirm_password: 'ยืนยันรหัสผ่าน',
    auth_email: 'อีเมล',
    auth_register_now: 'สมัครสมาชิกตอนนี้',
    auth_already_acc: 'มีบัญชีอยู่แล้ว?',
    auth_sign_in: 'เข้าสู่ระบบ',
    auth_register: 'สมัครสมาชิก',
    auth_back_home: 'กลับสู่เว็บไซต์',
    auth_dont_have_acc: "ยังไม่มีบัญชีใช่ไหม?",
    auth_login_success: 'ยินดีต้อนรับกลับมา',
    auth_reg_success: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ',
    auth_pass_mismatch: 'รหัสผ่านไม่ตรงกัน',
    auth_conn_error: 'ข้อผิดพลาดในการเชื่อมต่อ',
    auth_login_failed: 'เข้าสู่ระบบล้มเหลว',
    auth_reg_failed: 'สมัครสมาชิกล้มเหลว',

    // Misc / Filters - by worapol สุดหล่อ
    en: 'อังกฤษ',
    th: 'ไทย',
    in: 'นิ้ว',
    cm: 'ซม.',
    '2d': '2D',
    brand: 'แบรนด์',
    type: 'ประเภท',
    category: 'หมวดหมู่',
    sort: 'จัดเรียง',
    sale: 'ลดราคา',
    cart_shipping_pending: 'โปรดระบุที่อยู่จัดส่งก่อน',
    f_tagline: 'จุดหมายปลายทางชั้นนำสำหรับการคัดสรรและสินค้าหายาก',

    // Super Admin - by worapol สุดหล่อ
    super_admin_welcome: 'ยินดีต้อนรับ!',
    super_admin_desc_1: 'คุณเข้าสู่ระบบในฐานะ',
    super_admin_desc_2: 'กรุณาเลือกระบบที่คุณต้องการเข้าใช้งาน:',
    super_admin_btn_products: 'จัดการสินค้า/ออเดอร์ (ระบบปกติ)',
    super_admin_btn_admins: 'จัดการแอดมิน (ต้องสแกนใบหน้า)',
  }
};

export const LanguageProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // Helper to get the correct storage key based on current user - by worapol สุดหล่อ
  const getLangKey = (u) => {
    if (u && u.id) return `velin_lang_${u.id}`;
    return 'velin_lang_guest';
  };

  // Initialize with the language for the current user in storage, or 'en' - by worapol สุดหล่อ
  const [language, setLanguage] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const key = storedUser ? `velin_lang_${storedUser.id}` : 'velin_lang_guest';
      return localStorage.getItem(key) || 'en';
    } catch {
      return 'en';
    }
  });

  // Keep state in sync with user changes (Login/Logout/Switch) - by worapol สุดหล่อ
  useEffect(() => {
    const syncLanguage = async () => {
      const key = getLangKey(user);
      const localPref = localStorage.getItem(key);

      // 1. Immediately switch to local preference if exists, or default to 'en' - by worapol สุดหล่อ
      // This avoids showing the PREVIOUS user's language while the API is loading. - by worapol สุดหล่อ
      if (localPref) {
        setLanguage(localPref);
      } else {
        // If no local preference for THIS user, clear the state to 'en' immediately - by worapol สุดหล่อ
        setLanguage('en');
      }

      // 2. Then, if logged in, try to fetch the absolute truth from the DB - by worapol สุดหล่อ
      if (user) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data && res.data.preferred_language) {
            setLanguage(res.data.preferred_language);
            localStorage.setItem(key, res.data.preferred_language);
          }
        } catch (err) {
          console.error("Failed to fetch language from DB");
        }
      }
    };
    
    syncLanguage();
  }, [user?.id]);

  const toggleLanguage = async (lang) => {
    setLanguage(lang);
    const key = getLangKey(user);
    localStorage.setItem(key, lang);
    
    // We update the backend if user is logged in - by worapol สุดหล่อ
    if (user) {
      try {
        await api.put('/auth/profile', { preferred_language: lang });
      } catch (err) {
        console.error("Failed to sync language to DB");
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
