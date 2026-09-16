const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('Authentication & Authorization Tests', () => {
  const testStudentEmail = `test_student_${Date.now()}@test.com`;

  afterAll(async () => {
    // Clean test student
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_student_%']);
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: testStudentEmail,
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.email).toBe(testStudentEmail);
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should reject duplicate student registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Student',
          email: testStudentEmail,
          password: 'Password@123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid email or short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid',
          email: 'not-an-email',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login student with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudentEmail,
          password: 'Password@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudentEmail);
    });

    it('should login seeded Admin with demo credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@joineazy.demo',
          password: 'Admin@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@joineazy.demo',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('JWT and RBAC Enforcement', () => {
    let studentToken;
    let adminToken;

    beforeAll(async () => {
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student1@demo.com', password: 'Student@123' });
      studentToken = studentLogin.body.data.token;

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@joineazy.demo', password: 'Admin@123' });
      adminToken = adminLogin.body.data.token;
    });

    it('should reject unauthenticated request to protected endpoint', async () => {
      const res = await request(app).get('/api/assignments');
      expect(res.status).toBe(401);
    });

    it('should prevent student from accessing Admin endpoint', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Illegal Assignment',
          description: 'Desc',
          dueDate: new Date(),
          onedriveLink: 'https://onedrive.com',
          targetType: 'ALL_STUDENTS'
        });

      expect(res.status).toBe(403);
    });

    it('should prevent admin from creating a student group', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Illegal Group' });

      expect(res.status).toBe(403);
    });
  });
});
