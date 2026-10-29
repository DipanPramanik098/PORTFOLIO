// !================================================================================== 
// * express: ওয়েব সার্ভার ও রাউটিং
// * ejs: HTML-এর ভেতরে JavaScript লেখার টেমপ্লেট ইঞ্জিন
// * mongoose: MongoDB-র সাথে কথা বলে
// * dotenv: .env ফাইল থেকে গোপন তথ্য (পাসওয়ার্ড, কী) পড়ে
// * express-session: admin লগইন মনে রাখে
// * helmet / express-rate-limit: নিরাপত্তা
// * nodemailer: contact form থেকে ইমেইল পাঠায়
// * bcryptjs: পাসওয়ার্ড হ্যাশ করে রাখে (কখনো সাধারণ টেক্সটে পাসওয়ার্ড রাখা যাবে না)
// * nodemon (শুধু ডেভেলপমেন্টে): ফাইল সেভ করলেই সার্ভার নিজে রিস্টার্ট হয়


// !================================================================================== 
// require('dotenv').config() সবার আগে লিখতে হয়, নাহলে পরের কোডে process.env খালি থাকবে।
// app.set('view engine', 'ejs') বলার পর res.render('pages/home') লিখলে Express নিজে views/pages/home.ejs খুঁজে নেয়।
// express.static এর কারণে public/css/style.css ফাইলটা /css/style.css URL-এ পাওয়া যায়।
// express.urlencoded ও express.json মিডলওয়্যার, এরা ফর্ম থেকে আসা ডেটা req.body এ ঢুকিয়ে দেয়। Contact form ও admin form-এ এটা লাগবে।
// app.get('/') মানে কেউ হোম পেজে গেলে এই ফাংশন চলবে। res.render দ্বিতীয় আর্গুমেন্টে ডেটা পাঠায় (এখানে name)।


// !=====================================================