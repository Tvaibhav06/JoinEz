const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { seedData } = require('../src/db/seeds/001_seed_data');

describe('Joineazy Round 2: Courses, Groups & Submission Types Test Suite', () => {
  let adminToken;
  let s1Token; // Leader of Team Alpha
  let s2Token; // Member of Team Alpha (non-leader)
  let s4Token; // Leader of Team Beta
  let s5Token; // Member of Team Beta (non-leader)

  let courses;

  beforeAll(async () => {
    // Seed fresh Round 2 database
    await seedData();

    // 1. Admin login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@joineazy.demo', password: 'Admin@123' });
    adminToken = adminLogin.body.data.token;

    // 2. Student logins
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

    const s5Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student5@demo.com', password: 'Student@123' });
    s5Token = s5Login.body.data.token;

    // Fetch courses for reference
    const coursesRes = await pool.query('SELECT * FROM courses ORDER BY id ASC');
    courses = coursesRes.rows;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Course Relationships & Access Control', () => {
    it('should return enrolled courses for student', async () => {
      // s1 is enrolled in CS301 (Web Dev) and CS302 (DBMS)
      const res = await request(app)
        .get('/api/courses/my-courses')
        .set('Authorization', `Bearer ${s1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      const titles = res.body.data.map((c) => c.title);
      expect(titles).toContain('CS301: Modern Web Development');
      expect(titles).toContain('CS302: Database Systems & Modeling');
      expect(res.body.data[0].professor_name).toBe('Prof. Sarah Jenkins');
    });

    it('should return taught courses with student count and analytics for Admin', async () => {
      const res = await request(app)
        .get('/api/courses/teaching')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);

      const webDev = res.body.data.find((c) => c.title.includes('CS301'));
      expect(webDev).toBeDefined();
      expect(webDev.student_count).toBe(5); // all 5 enrolled
      expect(webDev.assignments_count).toBe(2);
      expect(webDev.submitted_count).toBeGreaterThanOrEqual(0);
      expect(webDev.pending_count).toBeGreaterThanOrEqual(0);
      expect(webDev.completion_percentage).toBeDefined();
    });

    it('should permit enrolled student to view course assignments', async () => {
      // s1 is enrolled in CS301
      const webDevCourse = courses.find((c) => c.title.includes('CS301'));
      const res = await request(app)
        .get(`/api/courses/${webDevCourse.id}/assignments`)
        .set('Authorization', `Bearer ${s1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe(webDevCourse.title);
      expect(Array.isArray(res.body.data.assignments)).toBe(true);
    });

    it('should deny unenrolled student access to course assignments with 403', async () => {
      // s4 is enrolled in CS301 and CS303, but NOT CS302 (Database Systems)
      const dbmsCourse = courses.find((c) => c.title.includes('CS302'));
      const res = await request(app)
        .get(`/api/courses/${dbmsCourse.id}/assignments`)
        .set('Authorization', `Bearer ${s4Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not enrolled/i);
    });
  });

  describe('2. Assignment Types (INDIVIDUAL vs GROUP)', () => {
    it('should allow admin to create an INDIVIDUAL assignment with course association', async () => {
      const webDevCourse = courses.find((c) => c.title.includes('CS301'));
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'CSS Grid & Flexbox Masterclass',
          description: 'Build a responsive layout using pure CSS grid and flexbox.',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          onedriveLink: 'https://onedrive.live.com/test-css-grid',
          targetType: 'ALL_STUDENTS',
          courseId: webDevCourse.id,
          submissionType: 'INDIVIDUAL'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submission_type).toBe('INDIVIDUAL');
      expect(res.body.data.course_id).toBe(webDevCourse.id);
    });

    it('should allow admin to create a GROUP assignment targeted to specific group', async () => {
      const networksCourse = courses.find((c) => c.title.includes('CS303'));
      const groupRes = await pool.query("SELECT id FROM groups WHERE name = 'Team Beta'");
      const betaGroupId = groupRes.rows[0].id;

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'DNS Resolver Implementation',
          description: 'Collaborative team project implementing recursive DNS resolution.',
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          onedriveLink: 'https://onedrive.live.com/test-dns',
          targetType: 'GROUP',
          groupIds: [betaGroupId],
          courseId: networksCourse.id,
          submissionType: 'GROUP'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submission_type).toBe('GROUP');
      expect(res.body.data.course_id).toBe(networksCourse.id);
    });

    it('should reject invalid submission_type', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Assignment',
          description: 'Testing validation error',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          onedriveLink: 'https://onedrive.live.com/test-invalid',
          targetType: 'ALL_STUDENTS',
          submissionType: 'COLLABORATIVE_PAIR' // invalid enum
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/submission type/i);
    });
  });

  describe('3. Group Leader Authorization & Fan-Out Confirmation', () => {
    let networksGroupAssignId;

    beforeAll(async () => {
      // Find Assignment 3: Distributed TCP Socket Architecture (GROUP type, Team Beta, pending)
      const assignRes = await pool.query(
        "SELECT id FROM assignments WHERE title = 'Distributed TCP Socket Architecture'"
      );
      networksGroupAssignId = assignRes.rows[0].id;
    });

    it('should reject non-leader student attempting Step 1 on GROUP assignment with 403', async () => {
      // s5 is a member of Team Beta, but NOT the leader (s4 is the leader)
      const res = await request(app)
        .post(`/api/assignments/${networksGroupAssignId}/submission/step1`)
        .set('Authorization', `Bearer ${s5Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only the group leader/i);
    });

    it('should reject non-leader student attempting confirm (Step 2) on GROUP assignment with 403', async () => {
      const res = await request(app)
        .post(`/api/assignments/${networksGroupAssignId}/submission/confirm`)
        .set('Authorization', `Bearer ${s5Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only the group leader/i);
    });

    it('should allow group leader (s4) to record Step 1 on GROUP assignment', async () => {
      const res = await request(app)
        .post(`/api/assignments/${networksGroupAssignId}/submission/step1`)
        .set('Authorization', `Bearer ${s4Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.step1_selected).toBe(true);
      expect(res.body.data.is_leader).toBe(true);
      expect(res.body.data.submission_type).toBe('GROUP');
    });

    it('should allow group leader (s4) to confirm (Step 2) and reflect submission across ALL group members', async () => {
      const res = await request(app)
        .post(`/api/assignments/${networksGroupAssignId}/submission/confirm`)
        .set('Authorization', `Bearer ${s4Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.confirmed_by_leader_id).toBeDefined();

      // Check PostgreSQL database directly to verify BOTH s4 and s5 have confirmations
      const subRes = await pool.query(
        'SELECT student_id, confirmed_by_leader_id FROM submission_confirmations WHERE assignment_id = $1 ORDER BY student_id ASC',
        [networksGroupAssignId]
      );
      expect(subRes.rows.length).toBe(2);

      // Verify non-leader s5's submission status in API reflects as submitted
      const s5Status = await request(app)
        .get(`/api/assignments/${networksGroupAssignId}/submission`)
        .set('Authorization', `Bearer ${s5Token}`);

      expect(s5Status.status).toBe(200);
      expect(s5Status.body.data.has_submitted).toBe(true);
      expect(s5Status.body.data.submission.confirmed_by_leader_id).toBeDefined();
    });

    it('should reject duplicate group submission attempt by leader with 409', async () => {
      const res = await request(app)
        .post(`/api/assignments/${networksGroupAssignId}/submission/confirm`)
        .set('Authorization', `Bearer ${s4Token}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already confirmed/i);
    });
  });

  describe('4. Individual Submission Flow Isolation', () => {
    let individualAssignId;

    beforeAll(async () => {
      // Find Assignment 4: REST API Performance (INDIVIDUAL, CS301, ALL_STUDENTS)
      const assignRes = await pool.query(
        "SELECT id FROM assignments WHERE title = 'REST API Performance & Caching Benchmarks'"
      );
      individualAssignId = assignRes.rows[0].id;
    });

    it('should allow student (s1) to submit individual assignment affecting ONLY s1', async () => {
      // Step 1
      const step1Res = await request(app)
        .post(`/api/assignments/${individualAssignId}/submission/step1`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(step1Res.status).toBe(200);

      // Step 2 Confirm
      const confirmRes = await request(app)
        .post(`/api/assignments/${individualAssignId}/submission/confirm`)
        .set('Authorization', `Bearer ${s1Token}`);

      expect(confirmRes.status).toBe(201);
      expect(confirmRes.body.data.confirmed_by_leader_id).toBeNull();

      // Check s2 status - s2 must remain pending!
      const s2Status = await request(app)
        .get(`/api/assignments/${individualAssignId}/submission`)
        .set('Authorization', `Bearer ${s2Token}`);

      expect(s2Status.status).toBe(200);
      expect(s2Status.body.data.has_submitted).toBe(false);
    });
  });

  describe('5. Server-Side Status Filtering in Admin Monitoring', () => {
    let dbmsAssignId;

    beforeAll(async () => {
      // Assignment 1: DBMS (s1 confirmed, s2 confirmed, s3 pending)
      const assignRes = await pool.query(
        "SELECT id FROM assignments WHERE title = 'DBMS Relational Algebra & SQL Case Study'"
      );
      dbmsAssignId = assignRes.rows[0].id;
    });

    it('should return ALL students when no filter or status=ALL', async () => {
      const res = await request(app)
        .get(`/api/admin/assignments/${dbmsAssignId}/students?status=ALL`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // CS302 has 3 enrolled students (s1, s2, s3)
      expect(res.body.data.students.length).toBe(3);
    });

    it('should return ONLY submitted students when status=SUBMITTED', async () => {
      const res = await request(app)
        .get(`/api/admin/assignments/${dbmsAssignId}/students?status=SUBMITTED`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students.length).toBe(2);
      res.body.data.students.forEach((s) => {
        expect(s.status).toBe('confirmed');
        expect(s.confirmed_at).not.toBeNull();
      });
    });

    it('should return ONLY pending students when status=PENDING', async () => {
      const res = await request(app)
        .get(`/api/admin/assignments/${dbmsAssignId}/students?status=PENDING`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students.length).toBe(1);
      expect(res.body.data.students[0].student_email).toBe('student3@demo.com');
      expect(res.body.data.students[0].status).toBe('pending');
      expect(res.body.data.students[0].confirmed_at).toBeNull();
    });
  });

  describe('6. Legacy Migration Verification', () => {
    it('should ensure all assignments have a valid course_id and submission_type', async () => {
      const res = await pool.query(
        'SELECT COUNT(*)::int AS count FROM assignments WHERE course_id IS NULL OR submission_type IS NULL'
      );
      expect(res.rows[0].count).toBe(0);
    });

    it('should ensure all groups have a valid leader_id', async () => {
      const res = await pool.query(
        'SELECT COUNT(*)::int AS count FROM groups WHERE leader_id IS NULL'
      );
      expect(res.rows[0].count).toBe(0);
    });
  });
});
