const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');

async function seedData() {
  console.log('🌱 Seeding Joineazy Round 2 demo data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clean existing data in reverse dependency order
    await client.query(`
      TRUNCATE
        submission_confirmations,
        assignment_targets,
        assignments,
        course_enrollments,
        courses,
        group_members,
        groups,
        users
      RESTART IDENTITY CASCADE
    `);

    // 1. Password hashes
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    // 2. Insert Professor / Admin
    const adminRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `, ['Prof. Sarah Jenkins', 'admin@joineazy.demo', adminPasswordHash, 'admin']);
    const adminId = adminRes.rows[0].id;

    // 3. Insert Students
    const studentsData = [
      { name: 'Aarav Sharma', email: 'student1@demo.com' },
      { name: 'Bhavya Patel', email: 'student2@demo.com' },
      { name: 'Chetan Kumar', email: 'student3@demo.com' },
      { name: 'Diya Rao', email: 'student4@demo.com' },
      { name: 'Eshan Verma', email: 'student5@demo.com' }
    ];

    const studentIds = [];
    for (const student of studentsData) {
      const sRes = await client.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [student.name, student.email, studentPasswordHash, 'student']);
      studentIds.push(sRes.rows[0].id);
    }
    const [s1, s2, s3, s4, s5] = studentIds;

    // 4. Insert Courses
    const coursesData = [
      {
        title: 'CS301: Modern Web Development',
        description: 'Full-stack web application engineering, REST architecture, state management, and responsive interface design.'
      },
      {
        title: 'CS302: Database Systems & Modeling',
        description: 'Relational algebra, normalized schema design, transaction atomicity, query performance, and indexing strategies.'
      },
      {
        title: 'CS303: Computer Networks & Distributed Systems',
        description: 'Network protocols, socket programming, distributed mutual exclusion, and concurrent server architecture.'
      }
    ];

    const courseIds = [];
    for (const course of coursesData) {
      const cRes = await client.query(`
        INSERT INTO courses (title, description, professor_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [course.title, course.description, adminId]);
      courseIds.push(cRes.rows[0].id);
    }
    const [courseWebDev, courseDbms, courseNetworks] = courseIds;

    // 5. Insert Course Enrollments
    // CS301 (Web Dev) - All 5 students enrolled
    for (const sid of [s1, s2, s3, s4, s5]) {
      await client.query(`
        INSERT INTO course_enrollments (course_id, student_id)
        VALUES ($1, $2)
      `, [courseWebDev, sid]);
    }

    // CS302 (Database Systems) - s1, s2, s3 enrolled
    for (const sid of [s1, s2, s3]) {
      await client.query(`
        INSERT INTO course_enrollments (course_id, student_id)
        VALUES ($1, $2)
      `, [courseDbms, sid]);
    }

    // CS303 (Computer Networks) - s4, s5 enrolled
    for (const sid of [s4, s5]) {
      await client.query(`
        INSERT INTO course_enrollments (course_id, student_id)
        VALUES ($1, $2)
      `, [courseNetworks, sid]);
    }

    // 6. Insert Groups with explicit Leaders
    // Team Alpha: created by s1, leader is s1
    const groupAlphaRes = await client.query(`
      INSERT INTO groups (name, created_by, leader_id)
      VALUES ($1, $2, $2)
      RETURNING id
    `, ['Team Alpha', s1]);
    const alphaId = groupAlphaRes.rows[0].id;

    // Team Beta: created by s4, leader is s4
    const groupBetaRes = await client.query(`
      INSERT INTO groups (name, created_by, leader_id)
      VALUES ($1, $2, $2)
      RETURNING id
    `, ['Team Beta', s4]);
    const betaId = groupBetaRes.rows[0].id;

    // 7. Insert Group Members
    // Team Alpha: s1, s2, s3
    await client.query(`
      INSERT INTO group_members (group_id, student_id) VALUES
      ($1, $2),
      ($1, $3),
      ($1, $4)
    `, [alphaId, s1, s2, s3]);

    // Team Beta: s4, s5
    await client.query(`
      INSERT INTO group_members (group_id, student_id) VALUES
      ($1, $2),
      ($1, $3)
    `, [betaId, s4, s5]);

    // 8. Insert Assignments across Courses & Submission Types
    // Assignment 1: DBMS Relational Algebra (Course: CS302, Individual, Target: ALL_STUDENTS)
    const dueDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const assign1Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      'DBMS Relational Algebra & SQL Case Study',
      'Analyze normalized schemas, construct optimized SQL join queries with explain plans, and submit your technical report to OneDrive.',
      dueDate1,
      'https://onedrive.live.com/demo/joineazy-dbms-assignment',
      adminId,
      courseDbms,
      'INDIVIDUAL'
    ]);
    const assign1Id = assign1Res.rows[0].id;

    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'ALL_STUDENTS', NULL)
    `, [assign1Id]);

    // Assignment 2: Full-Stack Portal (Course: CS301, Group, Target: Team Alpha)
    const dueDate2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const assign2Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      'Full-Stack Portal with JWT Authentication',
      'Build and deploy a collaborative React portal with JWT session management, RBAC, and containerized Docker setup. Group leader must submit final package.',
      dueDate2,
      'https://onedrive.live.com/demo/joineazy-webdev-assignment',
      adminId,
      courseWebDev,
      'GROUP'
    ]);
    const assign2Id = assign2Res.rows[0].id;

    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'GROUP', $2)
    `, [assign2Id, alphaId]);

    // Assignment 3: Distributed TCP Sockets (Course: CS303, Group, Target: Team Beta)
    const dueDate3 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const assign3Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      'Distributed TCP Socket Architecture',
      'Implement multi-threaded non-blocking TCP socket server with custom packet serialization. Group leader submits final archive to OneDrive.',
      dueDate3,
      'https://onedrive.live.com/demo/joineazy-networks-assignment',
      adminId,
      courseNetworks,
      'GROUP'
    ]);
    const assign3Id = assign3Res.rows[0].id;

    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'GROUP', $2)
    `, [assign3Id, betaId]);

    // Assignment 4: REST API Performance (Course: CS301, Individual, Target: ALL_STUDENTS)
    const dueDate4 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    const assign4Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id, submission_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      'REST API Performance & Caching Benchmarks',
      'Conduct load testing on API endpoints using autocannon, configure reverse-proxy caching, and record findings in OneDrive.',
      dueDate4,
      'https://onedrive.live.com/demo/joineazy-api-benchmarks',
      adminId,
      courseWebDev,
      'INDIVIDUAL'
    ]);
    const assign4Id = assign4Res.rows[0].id;

    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'ALL_STUDENTS', NULL)
    `, [assign4Id]);

    // 9. Insert Submission Confirmations
    // For Assignment 1 (Individual, DBMS):
    // s1 confirmed, s2 confirmed, s3 pending
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes', 'confirmed', NULL),
      ($1, $3, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '55 minutes', 'confirmed', NULL)
    `, [assign1Id, s1, s2]);

    // For Assignment 2 (Group, Web Dev):
    // Confirmed by Leader s1 (Aarav) on behalf of Team Alpha! Fan-out to s1, s2, s3
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status, confirmed_by_leader_id)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours 50 minutes', 'confirmed', $2),
      ($1, $3, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours 50 minutes', 'confirmed', $2),
      ($1, $4, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours 50 minutes', 'confirmed', $2)
    `, [assign2Id, s1, s2, s3]);

    // Assignment 3 (Group, Networks) has 0 confirmations (pending leader submission from s4)
    // Assignment 4 (Individual, Web Dev) has 0 confirmations (pending)

    await client.query('COMMIT');
    console.log('✅ Round 2 demo seed data successfully populated:');
    console.log('   - 1 Admin/Professor: admin@joineazy.demo / Admin@123');
    console.log('   - 5 Students: student1@demo.com to student5@demo.com / Student@123');
    console.log('   - 3 Courses: CS301 (Web Dev), CS302 (DBMS), CS303 (Networks)');
    console.log('   - 2 Groups with Leaders: Team Alpha (Leader: s1), Team Beta (Leader: s4)');
    console.log('   - 4 Assignments across courses with INDIVIDUAL and GROUP submission types');
    console.log('   - Leader-acknowledged group submission (Team Alpha on Assignment 2)');
    console.log('   - Mixed individual and pending submission states ready for live demonstration.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedData()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData };
