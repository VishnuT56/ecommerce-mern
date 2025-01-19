const express = require('express');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
require('dotenv').config();

const authMiddleware=require('../middleware/authMiddleware')

const router = express.Router();

// Fetch all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    const { title, price, image } = req.body;
    const newProduct = new Product({ title, price, image });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {

  const { id } = req.params;
  if (!id || id.trim() === '') {
    return res.status(400).json({ error: 'Product ID is required' });
  }


  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//payment

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
router.post('/upiPayment', authMiddleware, async (req, res) => {
  try {
    const { amount, email } = req.body;
    console.log(`Received Amount: ${amount}, Email: ${email}`);

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay Order Created:', order);

    res.status(201).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      email,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);

    if (err.response) {
      console.error('Razorpay API Response:', err.response.data); // Detailed API error
    }

    res.status(500).json({
      error: `Failed to initiate UPI payment: ${err.message || 'Unknown error'}`,
    });
  }
});

module.exports = router;
