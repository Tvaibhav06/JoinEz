const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { seedData } = require('../src/db/seeds/001_seed_data');

describe('Group, Assignment, Submission & Analytics Flow Tests', () => {
  let adminToken;
  let s1Token;
  let s2Token;
  let s4Token;
  let unassignedStudentToken;
  let unassignedStudentId;

  beforeAll(async () => {
    // Re-seed to ensure fresh baseline for every test execution
    await seedData();

    // Logins

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@joineazy.demo', password: 'Admin@123' });
    adminToken = adminLogin.body.data.token;

    const s1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@demo.com', password: 'Student@123' });
    s1Token = s1Login.body.data.token;

    const s2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student2@demo.com', password: 'Student@123' });
    s2Token = s2Login.body.data.token;

    const s4Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student4@demo.com', password: 'Student@123' });
    s4Token = s4Login.body.data.token;

    // Register an unassigned student
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Unassigned Student',
        email: `unassigned_${Date.now()}@demo.com`,
        password: 'Student@123'
      });
    unassignedStudentToken = reg.body.data.token;
    unassignedStudentId = reg.body.data.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['unassigned_%']);
    await pool.end();
  });

  describe('Group Management', () => {
    let createdGroupId;

    it('should allow unassigned student to create a group and become creator/member', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${unassignedStudentToken}`)
        .send({ name: 'Delta Force' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Delta Force');
      expect(res.body.data.members.length).toBe(1);
      expect(res.body.data.members[0].id).toBe(unassignedStudentId);
      createdGroupId = res.body.data.id;
    });

    it('should reject creating a second group for student already in a group', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${unassignedStudentToken}`)
        .send({ name: 'Second Group' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already a member/i);
    });

    it('should reject adding student who already belongs to another group', async () => {
      // student1 belongs to Team Alpha
      const res = await request(app)
        .post(`/api/groups/${createdGroupId}/members`)
        .set('Authorization', `Bearer ${unassignedStudentToken}`)
        .send({ emailOrId: 'student1@demo.com' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already belongs to another group/i);
    });

    it('should reject non-member from adding members to a group', async () => {
      // s4 belongs to Team Beta, attempts to add to Delta Force
      const res = await request(app)
        .post(`/api/groups/${createdGroupId}/members`)
        .set('Authorization', `Bearer ${s4Token}`)
        .send({ emailOrId: 'student2@demo.com' });

      expect(res.status).toBe(403);
    });
  });

  describe('Assignment Targeting & Student Visibility', () => {
    let testAssignmentId;

    it('should allow Admin to create assignment targeting a specific group', async () => {
      const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Advanced Compilers Lab',
          description: 'Lexical analysis using ANTLR. Upload to OneDrive.',
          dueDate: dueDate.toISOString(),
          onedriveLink: 'https://onedrive.live.com/demo/compilers',
          targetType: 'GROUP',
          groupIds: [1] // Team Alpha
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Advanced Compilers Lab');
      testAssignmentId = res.body.data.id;
    });

    it('should allow Team Alpha student (s1) to view the targeted assignment', async () => {
      const res = await request(app)
        .get(`/api/assignments/${testAssignmentId}`)
        .set('Authorization', `Bearer ${s1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Advanced Compilers Lab');
    });

    it('should block non-targeted student (s4) from viewing the restricted assignment', async () => {
      const res = await request(app)
        .get(`/api/assignments/${testAssignmentId}`)
        .set('Authorization', `Bearer ${s4Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not targeted to you/i);
    });
  });

  describe('Two-Step Submission Confirmation Flow', () => {
    // In seed data: Assignment 1 (DBMS) targets ALL_STUDENTS
    // s3 is in Team Alpha and has not submitted Assignment 1 yet
    let s3Token;
    beforeAll(async () => {
      const s3Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student3@demo.com', password: 'Student@123' });
      s3Token = s3Login.body.data.token;
    });

    it('should perform Step 1 intent verification without persisting confirmation', async () => {
      const res = await request(app)
        .post('/api/assignments/1/submission/step1')
        .set('Authorization', `Bearer ${s3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.step1_selected).toBe(true);

      // Verify status is still not submitted
      const statusRes = await request(app)
        .get('/api/assignments/1/submission')
        .set('Authorization', `Bearer ${s3Token}`);

      expect(statusRes.body.data.has_submitted).toBe(false);
    });

    it('should complete Step 2 and record final confirmation', async () => {
      const res = await request(app)
        .post('/api/assignments/1/submission/confirm')
        .set('Authorization', `Bearer ${s3Token}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('confirmed');

      // Now s3 has submitted, Team Alpha (s1, s2, s3) should have 3 of 3 (100% complete)
      const progressRes = await request(app)
        .get('/api/groups/1/progress')
        .set('Authorization', `Bearer ${s3Token}`);

      expect(progressRes.status).toBe(200);
      const dbmsProg = progressRes.body.data.find(p => p.assignment.id === 1);
      expect(dbmsProg.confirmed_members).toBe(3);
      expect(dbmsProg.progress_percentage).toBe(100);
      expect(dbmsProg.is_complete).toBe(true);
    });

    it('should reject duplicate submission confirmation', async () => {
      const res = await request(app)
        .post('/api/assignments/1/submission/confirm')
        .set('Authorization', `Bearer ${s3Token}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already confirmed/i);
    });
  });

  describe('Admin Monitoring & Analytics', () => {
    it('should retrieve group-wise monitoring for an assignment', async () => {
      const res = await request(app)
        .get('/api/admin/assignments/1/groups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.groups.length).toBeGreaterThan(0);
      const alpha = res.body.data.groups.find(g => g.group_name === 'Team Alpha');
      expect(alpha).toBeDefined();
      expect(alpha.members.length).toBe(3);
    });

    it('should retrieve student-wise monitoring for an assignment', async () => {
      const res = await request(app)
        .get('/api/admin/assignments/1/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students.length).toBeGreaterThan(0);
    });

    it('should return valid completion analytics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/completion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_expected).toBeGreaterThan(0);
      expect(res.body.data.completion_percentage).toBeGreaterThanOrEqual(0);
    });

    it('should return valid group-performance analytics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/group-performance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const beta = res.body.data.find(g => g.group_name === 'Team Beta');
      expect(beta).toBeDefined();
      expect(beta.expected_submissions).toBeGreaterThan(0);
    });
  });
});
