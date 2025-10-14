#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting User Management System...\n');

// Start backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

// Handle backend output
backend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running') || output.includes('listening')) {
    console.log('✅ Backend started successfully');
  }
});

backend.stderr.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('DeprecationWarning') && !output.includes('Warning: Duplicate schema index')) {
    console.error('Backend Error:', output);
  }
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Ready in') || output.includes('Local:')) {
    console.log('✅ Frontend started successfully');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend: http://localhost:5000');
    console.log('\n📝 Development server is ready!\n');
  }
});

frontend.stderr.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('redux-persist failed to create sync storage') && 
      !output.includes('EBUSY: resource busy or locked')) {
    console.error('Frontend Error:', output);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
