const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');

async function seedData() {
  console.log('🌱 Seeding database demo data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clean existing data in reverse dependency order
    await client.query('TRUNCATE submission_confirmations, assignment_targets, assignments, group_members, groups, users RESTART IDENTITY CASCADE');

    // 1. Password hashes
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    // 2. Insert Admin
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

    // 4. Insert Groups
    // Team Alpha created by student1
    const groupAlphaRes = await client.query(`
      INSERT INTO groups (name, created_by)
      VALUES ($1, $2)
      RETURNING id
    `, ['Team Alpha', s1]);
    const alphaId = groupAlphaRes.rows[0].id;

    // Team Beta created by student4
    const groupBetaRes = await client.query(`
      INSERT INTO groups (name, created_by)
      VALUES ($1, $2)
      RETURNING id
    `, ['Team Beta', s4]);
    const betaId = groupBetaRes.rows[0].id;

    // 5. Insert Group Members
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

    // 6. Insert Assignments
    // Assignment 1: DBMS (All students)
    const dueDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const assign1Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'DBMS Relational Algebra & SQL Case Study',
      'Analyze normalized relational schemas, construct optimized SQL join queries with explain plans, and submit your technical report to the OneDrive folder.',
      dueDate1,
      'https://onedrive.live.com/demo/joineazy-dbms-assignment',
      adminId
    ]);
    const assign1Id = assign1Res.rows[0].id;

    // Target Assignment 1 to ALL_STUDENTS
    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'ALL_STUDENTS', NULL)
    `, [assign1Id]);

    // Assignment 2: OS (Team Alpha only)
    const dueDate2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const assign2Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'Operating Systems Distributed File Systems',
      'Implement distributed mutual exclusion and consistent file system cache replication. Upload your source archive and test benchmarks externally to OneDrive.',
      dueDate2,
      'https://onedrive.live.com/demo/joineazy-os-assignment',
      adminId
    ]);
    const assign2Id = assign2Res.rows[0].id;

    // Target Assignment 2 to Team Alpha
    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'GROUP', $2)
    `, [assign2Id, alphaId]);

    // Assignment 3: Networks (Team Beta only)
    const dueDate3 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const assign3Res = await client.query(`
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'Computer Networks Socket Architecture',
      'Develop a multi-threaded non-blocking TCP chat service with protocol framing. Export packet capture files and upload to the OneDrive link.',
      dueDate3,
      'https://onedrive.live.com/demo/joineazy-networks-assignment',
      adminId
    ]);
    const assign3Id = assign3Res.rows[0].id;

    // Target Assignment 3 to Team Beta
    await client.query(`
      INSERT INTO assignment_targets (assignment_id, target_type, group_id)
      VALUES ($1, 'GROUP', $2)
    `, [assign3Id, betaId]);

    // 7. Insert Submission Confirmations
    // For Assignment 1 (DBMS):
    // Team Alpha: s1 confirmed, s2 confirmed, s3 pending
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes', 'confirmed'),
      ($1, $3, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '55 minutes', 'confirmed')
    `, [assign1Id, s1, s2]);

    // Team Beta: s4 confirmed, s5 pending
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes', 'confirmed')
    `, [assign1Id, s4]);

    // For Assignment 2 (OS): Team Alpha: s1 confirmed, s2 pending, s3 pending
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours 55 minutes', 'confirmed')
    `, [assign2Id, s1]);

    // For Assignment 3 (Networks): Team Beta: s4 confirmed, s5 confirmed -> 100% Complete!
    await client.query(`
      INSERT INTO submission_confirmations (assignment_id, student_id, step1_selected_at, confirmed_at, status)
      VALUES
      ($1, $2, CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours 50 minutes', 'confirmed'),
      ($1, $3, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours 40 minutes', 'confirmed')
    `, [assign3Id, s4, s5]);

    await client.query('COMMIT');
    console.log('✅ Demo seed data successfully populated:');
    console.log('   - 1 Admin: admin@joineazy.demo / Admin@123');
    console.log('   - 5 Students: student1@demo.com to student5@demo.com / Student@123');
    console.log('   - 2 Groups: Team Alpha, Team Beta');
    console.log('   - 3 Assignments: All-students, Team Alpha specific, Team Beta specific');
    console.log('   - Mixed confirmed and pending submissions populated.');
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
