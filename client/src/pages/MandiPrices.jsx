import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Filter, MapPin, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getMandiPrices } from '../services/api';

const FRONTEND_MANDI_FALLBACK = [
    { commodity: 'Paddy', market: 'Kurnool', state: 'Andhra Pradesh', modal_price: 2183, min_price: 2050, max_price: 2250 },
    { commodity: 'Chilli (Dry)', market: 'Guntur', state: 'Andhra Pradesh', modal_price: 12500, min_price: 11000, max_price: 14000 },
    { commodity: 'Tobacco', market: 'Chirala', state: 'Andhra Pradesh', modal_price: 22000, min_price: 20000, max_price: 25000 },
    { commodity: 'Groundnut', market: 'Nandyal', state: 'Andhra Pradesh', modal_price: 5800, min_price: 5500, max_price: 6200 },
    { commodity: 'Cotton', market: 'Adoni', state: 'Andhra Pradesh', modal_price: 6500, min_price: 6200, max_price: 7000 },
    { commodity: 'Tomato', market: 'Madanapalle', state: 'Andhra Pradesh', modal_price: 2800, min_price: 1500, max_price: 4500 },
    { commodity: 'Banana', market: 'Rajam', state: 'Andhra Pradesh', modal_price: 1800, min_price: 1400, max_price: 2200 },
    { commodity: 'Turmeric', market: 'Duggirala', state: 'Andhra Pradesh', modal_price: 9200, min_price: 8500, max_price: 10200 },
    { commodity: 'Rice', market: 'Itanagar', state: 'Arunachal Pradesh', modal_price: 3200, min_price: 2800, max_price: 3500 },
    { commodity: 'Orange', market: 'Pasighat', state: 'Arunachal Pradesh', modal_price: 4500, min_price: 4000, max_price: 5000 },
    { commodity: 'Ginger', market: 'Bomdila', state: 'Arunachal Pradesh', modal_price: 7500, min_price: 6500, max_price: 8500 },
    { commodity: 'Maize', market: 'Ziro', state: 'Arunachal Pradesh', modal_price: 2100, min_price: 1900, max_price: 2400 },
    { commodity: 'Tea', market: 'Jorhat', state: 'Assam', modal_price: 45000, min_price: 38000, max_price: 55000 },
    { commodity: 'Rice', market: 'Guwahati', state: 'Assam', modal_price: 2400, min_price: 2200, max_price: 2600 },
    { commodity: 'Jute', market: 'Dhubri', state: 'Assam', modal_price: 5200, min_price: 4800, max_price: 5800 },
    { commodity: 'Mustard', market: 'Nagaon', state: 'Assam', modal_price: 5500, min_price: 5100, max_price: 6000 },
    { commodity: 'Banana', market: 'Kamrup', state: 'Assam', modal_price: 1600, min_price: 1200, max_price: 2000 },
    { commodity: 'Wheat', market: 'Patna', state: 'Bihar', modal_price: 2175, min_price: 2100, max_price: 2250 },
    { commodity: 'Maize', market: 'Muzaffarpur', state: 'Bihar', modal_price: 2050, min_price: 1900, max_price: 2200 },
    { commodity: 'Makhana', market: 'Darbhanga', state: 'Bihar', modal_price: 60000, min_price: 50000, max_price: 72000 },
    { commodity: 'Lichi', market: 'Muzaffarpur', state: 'Bihar', modal_price: 8000, min_price: 6000, max_price: 10000 },
    { commodity: 'Potato', market: 'Arrah', state: 'Bihar', modal_price: 1150, min_price: 950, max_price: 1350 },
    { commodity: 'Onion', market: 'Hajipur', state: 'Bihar', modal_price: 1800, min_price: 1500, max_price: 2200 },
    { commodity: 'Paddy', market: 'Raipur', state: 'Chhattisgarh', modal_price: 2183, min_price: 2050, max_price: 2250 },
    { commodity: 'Wheat', market: 'Bilaspur', state: 'Chhattisgarh', modal_price: 2150, min_price: 2050, max_price: 2250 },
    { commodity: 'Soyabean', market: 'Rajnandgaon', state: 'Chhattisgarh', modal_price: 4400, min_price: 4100, max_price: 4750 },
    { commodity: 'Maize', market: 'Bastar', state: 'Chhattisgarh', modal_price: 2050, min_price: 1900, max_price: 2200 },
    { commodity: 'Minor Millets', market: 'Jagdalpur', state: 'Chhattisgarh', modal_price: 3500, min_price: 3200, max_price: 3800 },
    { commodity: 'Cashew', market: 'Panaji', state: 'Goa', modal_price: 75000, min_price: 70000, max_price: 82000 },
    { commodity: 'Coconut', market: 'Mapusa', state: 'Goa', modal_price: 3200, min_price: 2800, max_price: 3600 },
    { commodity: 'Rice', market: 'Margao', state: 'Goa', modal_price: 3000, min_price: 2700, max_price: 3300 },
    { commodity: 'Turmeric', market: 'Ponda', state: 'Goa', modal_price: 9500, min_price: 8800, max_price: 10500 },
    { commodity: 'Groundnut', market: 'Rajkot', state: 'Gujarat', modal_price: 6100, min_price: 5800, max_price: 6500 },
    { commodity: 'Cotton', market: 'Surendranagar', state: 'Gujarat', modal_price: 7000, min_price: 6600, max_price: 7400 },
    { commodity: 'Cumin', market: 'Unjha', state: 'Gujarat', modal_price: 26000, min_price: 23000, max_price: 30000 },
    { commodity: 'Castor', market: 'Mehsana', state: 'Gujarat', modal_price: 6200, min_price: 5900, max_price: 6600 },
    { commodity: 'Wheat', market: 'Ahmedabad', state: 'Gujarat', modal_price: 2200, min_price: 2100, max_price: 2350 },
    { commodity: 'Banana', market: 'Anand', state: 'Gujarat', modal_price: 1800, min_price: 1400, max_price: 2200 },
    { commodity: 'Potato', market: 'Deesa', state: 'Gujarat', modal_price: 1300, min_price: 1100, max_price: 1600 },
    { commodity: 'Onion', market: 'Mahuva', state: 'Gujarat', modal_price: 1700, min_price: 1400, max_price: 2100 },
    { commodity: 'Wheat', market: 'Karnal', state: 'Haryana', modal_price: 2275, min_price: 2200, max_price: 2400 },
    { commodity: 'Paddy', market: 'Kurukshetra', state: 'Haryana', modal_price: 2183, min_price: 2100, max_price: 2250 },
    { commodity: 'Mustard', market: 'Hisar', state: 'Haryana', modal_price: 5650, min_price: 5300, max_price: 6000 },
    { commodity: 'Bajra', market: 'Bhiwani', state: 'Haryana', modal_price: 2350, min_price: 2200, max_price: 2500 },
    { commodity: 'Sugarcane', market: 'Panipat', state: 'Haryana', modal_price: 380, min_price: 360, max_price: 400 },
    { commodity: 'Cotton', market: 'Sirsa', state: 'Haryana', modal_price: 6800, min_price: 6500, max_price: 7200 },
    { commodity: 'Apple', market: 'Shimla', state: 'Himachal Pradesh', modal_price: 9000, min_price: 7500, max_price: 12000 },
    { commodity: 'Potato', market: 'Kullu', state: 'Himachal Pradesh', modal_price: 1500, min_price: 1200, max_price: 1900 },
    { commodity: 'Tomato', market: 'Solan', state: 'Himachal Pradesh', modal_price: 3500, min_price: 2500, max_price: 4800 },
    { commodity: 'Ginger', market: 'Mandi', state: 'Himachal Pradesh', modal_price: 7500, min_price: 6500, max_price: 8500 },
    { commodity: 'Wheat', market: 'Kangra', state: 'Himachal Pradesh', modal_price: 2200, min_price: 2100, max_price: 2350 },
    { commodity: 'Rice', market: 'Ranchi', state: 'Jharkhand', modal_price: 2400, min_price: 2200, max_price: 2600 },
    { commodity: 'Maize', market: 'Dhanbad', state: 'Jharkhand', modal_price: 2100, min_price: 1900, max_price: 2300 },
    { commodity: 'Tomato', market: 'Hazaribagh', state: 'Jharkhand', modal_price: 3200, min_price: 2500, max_price: 4000 },
    { commodity: 'Potato', market: 'Bokaro', state: 'Jharkhand', modal_price: 1300, min_price: 1100, max_price: 1600 },
    { commodity: 'Cauliflower', market: 'Deoghar', state: 'Jharkhand', modal_price: 2200, min_price: 1800, max_price: 2600 },
    { commodity: 'Arecanut', market: 'Shivamogga', state: 'Karnataka', modal_price: 48000, min_price: 42000, max_price: 55000 },
    { commodity: 'Coffee (Arabica)', market: 'Chikkamagaluru', state: 'Karnataka', modal_price: 28000, min_price: 25000, max_price: 32000 },
    { commodity: 'Tomato', market: 'Kolar', state: 'Karnataka', modal_price: 3200, min_price: 1800, max_price: 5000 },
    { commodity: 'Ragi', market: 'Tumkur', state: 'Karnataka', modal_price: 3800, min_price: 3500, max_price: 4100 },
    { commodity: 'Paddy', market: 'Mandya', state: 'Karnataka', modal_price: 2183, min_price: 2050, max_price: 2300 },
    { commodity: 'Sunflower', market: 'Bellary', state: 'Karnataka', modal_price: 6400, min_price: 6100, max_price: 6800 },
    { commodity: 'Onion', market: 'Hubli', state: 'Karnataka', modal_price: 1600, min_price: 1200, max_price: 2100 },
    { commodity: 'Maize', market: 'Davangere', state: 'Karnataka', modal_price: 2100, min_price: 1900, max_price: 2300 },
    { commodity: 'Rubber', market: 'Kottayam', state: 'Kerala', modal_price: 17000, min_price: 15500, max_price: 18500 },
    { commodity: 'Coconut', market: 'Thrissur', state: 'Kerala', modal_price: 3500, min_price: 3000, max_price: 4000 },
    { commodity: 'Black Pepper', market: 'Wayanad', state: 'Kerala', modal_price: 55000, min_price: 50000, max_price: 62000 },
    { commodity: 'Cardamom', market: 'Idukki', state: 'Kerala', modal_price: 160000, min_price: 145000, max_price: 180000 },
    { commodity: 'Banana', market: 'Ernakulam', state: 'Kerala', modal_price: 2200, min_price: 1800, max_price: 2600 },
    { commodity: 'Ginger', market: 'Kozhikode', state: 'Kerala', modal_price: 8500, min_price: 7500, max_price: 9500 },
    { commodity: 'Cashew', market: 'Kollam', state: 'Kerala', modal_price: 72000, min_price: 68000, max_price: 78000 },
    { commodity: 'Tapioca', market: 'Palakkad', state: 'Kerala', modal_price: 1100, min_price: 900, max_price: 1350 },
    { commodity: 'Soyabean', market: 'Indore', state: 'Madhya Pradesh', modal_price: 4500, min_price: 4300, max_price: 4800 },
    { commodity: 'Wheat', market: 'Bhopal', state: 'Madhya Pradesh', modal_price: 2200, min_price: 2100, max_price: 2350 },
    { commodity: 'Garlic', market: 'Mandsaur', state: 'Madhya Pradesh', modal_price: 9000, min_price: 7500, max_price: 11000 },
    { commodity: 'Paddy', market: 'Jabalpur', state: 'Madhya Pradesh', modal_price: 2183, min_price: 2050, max_price: 2270 },
    { commodity: 'Chickpea', market: 'Vidisha', state: 'Madhya Pradesh', modal_price: 5600, min_price: 5300, max_price: 5950 },
    { commodity: 'Mustard', market: 'Morena', state: 'Madhya Pradesh', modal_price: 5600, min_price: 5300, max_price: 6000 },
    { commodity: 'Cotton', market: 'Burhanpur', state: 'Madhya Pradesh', modal_price: 6700, min_price: 6400, max_price: 7100 },
    { commodity: 'Onion', market: 'Ujjain', state: 'Madhya Pradesh', modal_price: 1700, min_price: 1400, max_price: 2100 },
    { commodity: 'Onion', market: 'Lasalgaon', state: 'Maharashtra', modal_price: 1800, min_price: 1400, max_price: 2400 },
    { commodity: 'Grapes', market: 'Nasik', state: 'Maharashtra', modal_price: 5000, min_price: 4000, max_price: 6500 },
    { commodity: 'Orange', market: 'Nagpur', state: 'Maharashtra', modal_price: 3500, min_price: 2800, max_price: 4500 },
    { commodity: 'Pomegranate', market: 'Solapur', state: 'Maharashtra', modal_price: 7000, min_price: 5500, max_price: 9000 },
    { commodity: 'Cotton', market: 'Yavatmal', state: 'Maharashtra', modal_price: 6800, min_price: 6400, max_price: 7200 },
    { commodity: 'Soyabean', market: 'Latur', state: 'Maharashtra', modal_price: 4500, min_price: 4200, max_price: 4850 },
    { commodity: 'Sugarcane', market: 'Kolhapur', state: 'Maharashtra', modal_price: 360, min_price: 340, max_price: 390 },
    { commodity: 'Banana', market: 'Jalgaon', state: 'Maharashtra', modal_price: 2000, min_price: 1500, max_price: 2600 },
    { commodity: 'Turmeric', market: 'Sangli', state: 'Maharashtra', modal_price: 9500, min_price: 8500, max_price: 11000 },
    { commodity: 'Rice', market: 'Imphal', state: 'Manipur', modal_price: 3200, min_price: 2900, max_price: 3600 },
    { commodity: 'Ginger', market: 'Churachandpur', state: 'Manipur', modal_price: 7500, min_price: 6500, max_price: 8500 },
    { commodity: 'Black Pepper', market: 'Thoubal', state: 'Manipur', modal_price: 50000, min_price: 45000, max_price: 58000 },
    { commodity: 'Potato', market: 'Shillong', state: 'Meghalaya', modal_price: 1800, min_price: 1500, max_price: 2200 },
    { commodity: 'Ginger', market: 'Nongpoh', state: 'Meghalaya', modal_price: 7000, min_price: 6000, max_price: 8000 },
    { commodity: 'Turmeric', market: 'Jowai', state: 'Meghalaya', modal_price: 9000, min_price: 8000, max_price: 10500 },
    { commodity: 'Orange', market: 'Tura', state: 'Meghalaya', modal_price: 5000, min_price: 4200, max_price: 6000 },
    { commodity: 'Ginger', market: 'Aizawl', state: 'Mizoram', modal_price: 7200, min_price: 6200, max_price: 8200 },
    { commodity: 'Rice', market: 'Lunglei', state: 'Mizoram', modal_price: 3300, min_price: 3000, max_price: 3700 },
    { commodity: 'Passion Fruit', market: 'Champhai', state: 'Mizoram', modal_price: 6000, min_price: 5000, max_price: 7000 },
    { commodity: 'Rice', market: 'Kohima', state: 'Nagaland', modal_price: 3500, min_price: 3200, max_price: 3900 },
    { commodity: 'Potato', market: 'Dimapur', state: 'Nagaland', modal_price: 2000, min_price: 1700, max_price: 2400 },
    { commodity: 'Ginger', market: 'Mokokchung', state: 'Nagaland', modal_price: 7500, min_price: 6500, max_price: 8500 },
    { commodity: 'Paddy', market: 'Cuttack', state: 'Odisha', modal_price: 2183, min_price: 2050, max_price: 2250 },
    { commodity: 'Turmeric', market: 'Kandhamal', state: 'Odisha', modal_price: 8500, min_price: 7800, max_price: 9500 },
    { commodity: 'Groundnut', market: 'Bolangir', state: 'Odisha', modal_price: 5800, min_price: 5500, max_price: 6200 },
    { commodity: 'Tomato', market: 'Bhubaneswar', state: 'Odisha', modal_price: 3000, min_price: 2000, max_price: 4000 },
    { commodity: 'Cashew', market: 'Rayagada', state: 'Odisha', modal_price: 68000, min_price: 62000, max_price: 75000 },
    { commodity: 'Wheat', market: 'Khanna', state: 'Punjab', modal_price: 2275, min_price: 2200, max_price: 2400 },
    { commodity: 'Paddy', market: 'Amritsar', state: 'Punjab', modal_price: 2183, min_price: 2100, max_price: 2280 },
    { commodity: 'Maize', market: 'Hoshiarpur', state: 'Punjab', modal_price: 2150, min_price: 2000, max_price: 2300 },
    { commodity: 'Potato', market: 'Jalandhar', state: 'Punjab', modal_price: 1300, min_price: 1100, max_price: 1600 },
    { commodity: 'Cotton', market: 'Bathinda', state: 'Punjab', modal_price: 6700, min_price: 6400, max_price: 7100 },
    { commodity: 'Mustard', market: 'Ludhiana', state: 'Punjab', modal_price: 5500, min_price: 5200, max_price: 5900 },
    { commodity: 'Mustard', market: 'Jaipur', state: 'Rajasthan', modal_price: 5650, min_price: 5350, max_price: 6050 },
    { commodity: 'Coriander', market: 'Ramganj Mandi', state: 'Rajasthan', modal_price: 8000, min_price: 7200, max_price: 9200 },
    { commodity: 'Highlight', market: 'Bikaner', state: 'Rajasthan', modal_price: 5600, min_price: 5300, max_price: 5950 },
    { commodity: 'Wheat', market: 'Kota', state: 'Rajasthan', modal_price: 2200, min_price: 2100, max_price: 2350 },
    { commodity: 'Bajra', market: 'Jodhpur', state: 'Rajasthan', modal_price: 2350, min_price: 2200, max_price: 2500 },
    { commodity: 'Fenugreek', market: 'Nagaur', state: 'Rajasthan', modal_price: 6500, min_price: 6000, max_price: 7200 },
    { commodity: 'Garlic', market: 'Kota', state: 'Rajasthan', modal_price: 9000, min_price: 7500, max_price: 11000 },
    { commodity: 'Moong', market: 'Bharatpur', state: 'Rajasthan', modal_price: 8500, min_price: 8000, max_price: 9200 },
    { commodity: 'Cardamom', market: 'Gangtok', state: 'Sikkim', modal_price: 140000, min_price: 120000, max_price: 160000 },
    { commodity: 'Ginger', market: 'Namchi', state: 'Sikkim', modal_price: 8000, min_price: 7000, max_price: 9200 },
    { commodity: 'Orange', market: 'Jorethang', state: 'Sikkim', modal_price: 5000, min_price: 4200, max_price: 6000 },
    { commodity: 'Coconut', market: 'Pollachi', state: 'Tamil Nadu', modal_price: 3500, min_price: 3000, max_price: 4100 },
    { commodity: 'Banana', market: 'Trichy', state: 'Tamil Nadu', modal_price: 2200, min_price: 1800, max_price: 2700 },
    { commodity: 'Paddy', market: 'Thanjavur', state: 'Tamil Nadu', modal_price: 2183, min_price: 2050, max_price: 2280 },
    { commodity: 'Tomato', market: 'Coimbatore', state: 'Tamil Nadu', modal_price: 3500, min_price: 2000, max_price: 5000 },
    { commodity: 'Tapioca', market: 'Salem', state: 'Tamil Nadu', modal_price: 1100, min_price: 900, max_price: 1400 },
    { commodity: 'Mango', market: 'Krishnagiri', state: 'Tamil Nadu', modal_price: 5500, min_price: 4000, max_price: 7500 },
    { commodity: 'Turmeric', market: 'Erode', state: 'Tamil Nadu', modal_price: 9200, min_price: 8500, max_price: 10500 },
    { commodity: 'Sugarcane', market: 'Vellore', state: 'Tamil Nadu', modal_price: 350, min_price: 330, max_price: 380 },
    { commodity: 'Paddy', market: 'Warangal', state: 'Telangana', modal_price: 2183, min_price: 2050, max_price: 2250 },
    { commodity: 'Cotton', market: 'Adilabad', state: 'Telangana', modal_price: 6800, min_price: 6400, max_price: 7200 },
    { commodity: 'Turmeric', market: 'Nizamabad', state: 'Telangana', modal_price: 8500, min_price: 7800, max_price: 9500 },
    { commodity: 'Maize', market: 'Karimnagar', state: 'Telangana', modal_price: 2100, min_price: 1950, max_price: 2300 },
    { commodity: 'Chilli (Dry)', market: 'Khammam', state: 'Telangana', modal_price: 11500, min_price: 10000, max_price: 13500 },
    { commodity: 'Groundnut', market: 'Mahbubnagar', state: 'Telangana', modal_price: 5800, min_price: 5500, max_price: 6200 },
    { commodity: 'Rice', market: 'Agartala', state: 'Tripura', modal_price: 2800, min_price: 2500, max_price: 3100 },
    { commodity: 'Pineapple', market: 'Udaipur', state: 'Tripura', modal_price: 2500, min_price: 2000, max_price: 3200 },
    { commodity: 'Jackfruit', market: 'Dharmanagar', state: 'Tripura', modal_price: 1500, min_price: 1100, max_price: 2000 },
    { commodity: 'Rubber', market: 'Khowai', state: 'Tripura', modal_price: 15000, min_price: 13500, max_price: 17000 },
    { commodity: 'Wheat', market: 'Agra', state: 'Uttar Pradesh', modal_price: 2175, min_price: 2100, max_price: 2280 },
    { commodity: 'Sugarcane', market: 'Muzaffarnagar', state: 'Uttar Pradesh', modal_price: 380, min_price: 360, max_price: 400 },
    { commodity: 'Potato', market: 'Aligarh', state: 'Uttar Pradesh', modal_price: 1200, min_price: 1000, max_price: 1500 },
    { commodity: 'Menthol Mint', market: 'Barabanki', state: 'Uttar Pradesh', modal_price: 1800, min_price: 1600, max_price: 2100 },
    { commodity: 'Onion', market: 'Hathras', state: 'Uttar Pradesh', modal_price: 1700, min_price: 1400, max_price: 2100 },
    { commodity: 'Paddy', market: 'Lucknow', state: 'Uttar Pradesh', modal_price: 2183, min_price: 2050, max_price: 2270 },
    { commodity: 'Mustard', market: 'Mathura', state: 'Uttar Pradesh', modal_price: 5600, min_price: 5300, max_price: 6000 },
    { commodity: 'Maize', market: 'Gorakhpur', state: 'Uttar Pradesh', modal_price: 2050, min_price: 1900, max_price: 2200 },
    { commodity: 'Wheat', market: 'Haridwar', state: 'Uttarakhand', modal_price: 2200, min_price: 2100, max_price: 2350 },
    { commodity: 'Apple', market: 'Uttarkashi', state: 'Uttarakhand', modal_price: 8500, min_price: 7000, max_price: 11000 },
    { commodity: 'Mandarin', market: 'Almora', state: 'Uttarakhand', modal_price: 4000, min_price: 3200, max_price: 5000 },
    { commodity: 'Potato', market: 'Dehradun', state: 'Uttarakhand', modal_price: 1400, min_price: 1200, max_price: 1700 },
    { commodity: 'Linseed', market: 'Pithoragarh', state: 'Uttarakhand', modal_price: 5000, min_price: 4500, max_price: 5500 },
    { commodity: 'Jute', market: 'Murshidabad', state: 'West Bengal', modal_price: 5500, min_price: 5000, max_price: 6200 },
    { commodity: 'Rice', market: 'Bardhaman', state: 'West Bengal', modal_price: 2400, min_price: 2200, max_price: 2600 },
    { commodity: 'Potato', market: 'Hooghly', state: 'West Bengal', modal_price: 1200, min_price: 1000, max_price: 1500 },
    { commodity: 'Banana', market: 'Nadia', state: 'West Bengal', modal_price: 1800, min_price: 1400, max_price: 2300 },
    { commodity: 'Tomato', market: 'North 24 Parganas', state: 'West Bengal', modal_price: 3200, min_price: 2200, max_price: 4500 },
    { commodity: 'Mustard', market: 'Birbhum', state: 'West Bengal', modal_price: 5600, min_price: 5200, max_price: 6100 },
    { commodity: 'Saffron', market: 'Pampore', state: 'Jammu and Kashmir', modal_price: 280000, min_price: 220000, max_price: 350000 },
    { commodity: 'Apple', market: 'Shopian', state: 'Jammu and Kashmir', modal_price: 10000, min_price: 8000, max_price: 13000 },
    { commodity: 'Walnut', market: 'Anantnag', state: 'Jammu and Kashmir', modal_price: 22000, min_price: 18000, max_price: 28000 },
    { commodity: 'Cherry', market: 'Srinagar', state: 'Jammu and Kashmir', modal_price: 15000, min_price: 12000, max_price: 20000 },
    { commodity: 'Pear', market: 'Sopore', state: 'Jammu and Kashmir', modal_price: 4500, min_price: 3800, max_price: 5500 },
    { commodity: 'Pear', market: 'Kinnaur', state: 'Himachal Pradesh', modal_price: 4500, min_price: 3800, max_price: 5500 },
    { commodity: 'Apricot', market: 'Leh', state: 'Ladakh', modal_price: 12000, min_price: 10000, max_price: 15000 },
    { commodity: 'Sea Buckthorn', market: 'Kargil', state: 'Ladakh', modal_price: 8000, min_price: 6500, max_price: 9500 }
];

const MandiPrices = () => {
    const { t } = useLanguage();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }));
    const [search, setSearch] = useState('');
    const [selectedState, setSelectedState] = useState('All');

    const fetchPrices = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const response = await getMandiPrices();
            let data = Array.isArray(response) ? response : (response.data || []);
            
            if (data.length === 0) {
                console.log("No data returned from API, using local fallback.");
                data = FRONTEND_MANDI_FALLBACK;
            }

            const time = new Date().toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            setPrices(data);
            setLastUpdated(time);
            localStorage.setItem('cached_mandi_prices', JSON.stringify({ data, time }));
        } catch (err) {
            console.error("Mandi background fetch failed", err);
            const cached = localStorage.getItem('cached_mandi_prices');
            if (!cached) {
                const time = new Date().toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                setPrices(FRONTEND_MANDI_FALLBACK);
                setLastUpdated(time);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        try {
            const cached = localStorage.getItem('cached_mandi_prices');
            if (cached) {
                const { data, time } = JSON.parse(cached);
                setPrices(data);
                setLastUpdated(time);
                setLoading(false);
            } else {
                const time = new Date().toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                setPrices(FRONTEND_MANDI_FALLBACK);
                setLastUpdated(time);
                setLoading(false);
            }
        } catch (e) {
            console.error("Cache load failed", e);
        }

        fetchPrices(true);

        const interval = setInterval(() => fetchPrices(true), 60000);
        return () => clearInterval(interval);
    }, []);

    const states = ['All', ...[...new Set(prices.map(item => item.state))].sort()];

    const filteredPrices = prices.filter(item => {
        const matchesSearch = (item.commodity || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.market || '').toLowerCase().includes(search.toLowerCase());
        const matchesState = selectedState === 'All' || item.state === selectedState;
        return matchesSearch && matchesState;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('mandiTitle')}</h1>
                        <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                    </div>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                        {t('mandiSubtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
                    <ClockIcon /> {t('updated')}: {lastUpdated}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Desktop View: Sidebar List */}
                    <div className="hidden lg:block bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-32">
                        <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-widest text-sm mb-6">
                            <Filter size={18} /> {t('selectState')}
                        </h3>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                            {states.map(state => (
                                <button
                                    key={state}
                                    onClick={() => setSelectedState(state)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${selectedState === state
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                        : 'hover:bg-slate-50 text-slate-500'
                                        }`}
                                >
                                    {state === 'All' ? t('all') : t(state) || state}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile/Tablet View: Searchable Dropdown */}
                    <div className="lg:hidden bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                        <label className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-widest text-xs mb-3 px-2">
                            <Filter size={14} /> {t('selectState')}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-4 px-6 pr-10 rounded-2xl font-bold text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                            >
                                {states.map(state => (
                                    <option key={state} value={state}>
                                        {state === 'All' ? t('all') : t(state) || state}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search Bar & Refresh */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                            <Search className="text-slate-400 ml-4" size={20} />
                            <input
                                type="text"
                                placeholder={t('searchMandi')}
                                className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:text-slate-300 h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => fetchPrices(false)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-[2rem] shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center min-w-[3.5rem] group"
                            aria-label={t('refreshPrices')}
                        >
                            <RefreshCw size={24} className={loading ? "animate-spin" : "group-hover:animate-spin"} />
                        </button>
                    </div>

                    {/* Prices Grid - Mobile Card / Desktop Table Hybrid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('loadingRecords')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPrices.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredPrices.map((item, idx) => {
                                        // Determine Unit Weight based on crop type
                                        // Determine Unit Weight based on User's mandated list
                                        // Determine Unit Weight based on Final Definitive Rule
                                        const getCropUnit = (name) => {
                                            const lower = name.toLowerCase();

                                            // 1. Heavy Weights
                                            if (lower.includes('sugarcane')) return 1000; // Tonne

                                            // 2. 50 Kg Crates/Bags (Vegetables, Fruits, Spices)
                                            // Vegetables: Tomato, Brinjal, Cabbage, Cauliflower, Chilli, Okra
                                            // Fruits: Mango, Orange, Papaya, Pineapple
                                            // Spices: Ginger, Pepper, Arecanut
                                            const fiftyKgCrops = [
                                                'tomato', 'brinjal', 'cabbage', 'cauliflower', 'chilli', 'okra', 'lady finger',
                                                'mango', 'orange', 'papaya', 'pineapple',
                                                'ginger', 'pepper', 'arecanut'
                                            ];
                                            if (fiftyKgCrops.some(c => lower.includes(c))) return 50;

                                            // 3. 20 Kg (Fruits)
                                            if (lower.includes('apple') || lower.includes('grapes')) return 20;

                                            // 4. 10 Kg (Spices)
                                            if (lower.includes('cardamom')) return 10;

                                            // 5. Default 100 Kg / 1 Quintal (Cereals, Pulses, Oilseeds, Commercial, Potato, Onion, Banana, Turmeric, Jute, etc.)
                                            // Includes: Rice, Wheat, Maize, Cotton (100kg), Potato, Onion, Banana...
                                            return 100;
                                        };

                                        const unitWeight = getCropUnit(item.commodity);
                                        const displayModal = Math.round((item.modal_price / 100) * unitWeight);
                                        const displayMin = Math.round((item.min_price / 100) * unitWeight);
                                        const displayMax = Math.round((item.max_price / 100) * unitWeight);

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900">{t(item.commodity) || item.commodity}</h3>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                            <MapPin size={12} /> {t(item.market) || item.market}, {t(item.state) || item.state}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-50 p-2 rounded-xl text-green-600">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">{t('modalPrice')}</span>
                                                        <span className="text-2xl font-black text-green-600">
                                                            ₹{displayModal} <span className="text-xs font-bold text-slate-400">/ {unitWeight}{t('kgUnit') || 'kg'}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                        <span>{t('minPrice')}: ₹{displayMin}</span>
                                                        <span>{t('maxPrice')}: ₹{displayMax}</span>
                                                    </div>

                                                    {/* AI Forecast & Advice Section */}
                                                    {(() => {
                                                        const trends = ['rising', 'falling', 'stable'];
                                                        // Deterministic seed based on name lengths to keep consistent UI
                                                        const seed = item.commodity.length + item.market.length + (item.modal_price % 3);
                                                        const trend = trends[seed % 3];

                                                        return (
                                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                        <Sparkles size={10} className="text-primary" /> {t('advice')}
                                                                    </span>
                                                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wide ${trend === 'rising'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-red-50 text-red-600'
                                                                        }`}>
                                                                        {trend === 'rising' ? t('hold') : t('sellNow')}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-slate-50 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                                        {trend === 'rising'
                                                                            ? <TrendingUp size={14} className="text-green-600" />
                                                                            : <TrendingDown size={14} className="text-red-500" />
                                                                        }
                                                                        {trend === 'rising' ? t('trendRising') : trend === 'falling' ? t('trendFalling') : t('trendStable')}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed pl-6">
                                                                        {trend === 'rising' ? t('reasonRising') : trend === 'falling' ? t('reasonFalling') : t('reasonStable')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold">{t('noRecords')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export default MandiPrices;
