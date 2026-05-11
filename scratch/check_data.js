const api = require('./frontend/src/services/api');
const axios = require('axios');

async function checkData() {
    try {
        const res = await axios.get('http://localhost:5000/api/products');
        const products = res.data;
        const categories = [...new Set(products.map(p => p.category))];
        const brands = [...new Set(products.map(p => p.brand))];
        console.log('Categories:', categories);
        console.log('Brands:', brands);
        
        const weirdOnes = products.filter(p => p.product_code === 'TSAJ-1309' || p.product_code === 'SFDTSB-0214');
        console.log('Weird Products:', JSON.stringify(weirdOnes, null, 2));
    } catch (err) {
        console.error('Error fetching products:', err.message);
    }
}

checkData();
