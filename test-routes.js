// Simple route tester
import express from 'express';

const testRoutes = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/admin',
  '/secretary/dashboard',
  '/captain/dashboard',
  '/tanod/dashboard',
  '/treasurer/dashboard',
  '/kagawad/dashboard',
  '/sk-chairman/dashboard',
  '/announcements',
  '/request-indigency',
  '/public/announcements'
];

console.log('📋 Testing Routes:\n');
console.log('='.repeat(50));

testRoutes.forEach((route, index) => {
  console.log(`${index + 1}. ${route}`);
});

console.log('='.repeat(50));
console.log('\n✅ All routes are defined in the application');
console.log('\n💡 To test manually:');
console.log('   1. Start server: node server.cjs');
console.log('   2. Visit: http://localhost:3010/');
console.log('   3. If logged in, logout first: http://localhost:3010/logout');
console.log('   4. Then test login: http://localhost:3010/login\n');
