import http from 'http';

const data = JSON.stringify({
  bookerName: "Library Test",
  bookerType: "faculty",
  purpose: "Self Test",
  labName: "achula",
  date: "2026-05-10",
  startTime: "10:00",
  endTime: "11:00",
  studentCount: 10
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/bookings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
