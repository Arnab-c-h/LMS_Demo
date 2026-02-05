// require('dotenv').config();

// const bcrypt = require('bcryptjs');
// const { PrismaClient } = require('@prisma/client');

// const prisma = new PrismaClient();

// async function main() {
// 	console.log('Start seeding ...');

// 	// 1. Create a hashed password
// 	const password = await bcrypt.hash(process.env.ADMIN_PWD, 12);

// 	// 2. Create or Update the Admin User
// 	const admin = await prisma.user.upsert({
// 		where: { email: 'admin@lms.com' },
// 		update: {}, // If exists, do nothing
// 		create: {
// 			email: 'admin@lms.com',
// 			name: 'Super Admin',
// 			password: password,
// 			role: 'ADMIN',
// 			rollNumber: 'ADMIN-001',
// 			active: true,
// 		},
// 	});

// 	console.log('Created Admin:', admin);
// }

// main()
// 	.catch((e) => {
// 		console.error(e);
// 		process.exit(1);
// 	})
// 	.finally(async () => {
// 		await prisma.$disconnect();
// 	});

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting Seed...');

	// 1. Clean Database (Optional: careful in production!)
	// We delete in reverse order of dependency
	await prisma.questionOption.deleteMany();
	await prisma.question.deleteMany();
	await prisma.quizAttempt.deleteMany();
	await prisma.quiz.deleteMany();
	await prisma.lessonProgress.deleteMany();
	await prisma.lesson.deleteMany();
	await prisma.module.deleteMany();
	await prisma.enrollment.deleteMany();
	await prisma.course.deleteMany();
	await prisma.user.deleteMany();

	console.log('🧹 Database cleaned.');

	// 2. Hash Password (same for everyone for easy testing)
	const password = await bcrypt.hash('pass1234', 12);

	// 3. Create Super Admin
	const admin = await prisma.user.create({
		data: {
			name: 'Super Admin',
			email: 'admin@lms.com',
			password: password,
			role: 'ADMIN',
			rollNumber: 'ADMIN-001',
			active: true,
		},
	});
	console.log('👤 Created Admin: admin@lms.com');

	// 4. Create Instructors
	const instr1 = await prisma.user.create({
		data: {
			name: 'Dr. Angela Yu',
			email: 'angela@lms.com',
			password: password,
			role: 'INSTRUCTOR',
			active: true,
			createdById: admin.id,
		},
	});

	const instr2 = await prisma.user.create({
		data: {
			name: 'Colt Steele',
			email: 'colt@lms.com',
			password: password,
			role: 'INSTRUCTOR',
			active: true,
			createdById: admin.id,
		},
	});
	console.log('👨‍🏫 Created Instructors: angela@lms.com, colt@lms.com');

	// 5. Create Students
	const studentsData = [
		{
			name: 'Alice Student',
			email: 'alice@lms.com',
			rollNumber: 'CS-2024-001',
		},
		{
			name: 'Bob Student',
			email: 'bob@lms.com',
			rollNumber: 'CS-2024-002',
		},
		{
			name: 'Charlie Student',
			email: 'charlie@lms.com',
			rollNumber: 'CS-2024-003',
		},
		{
			name: 'Diana Student',
			email: 'diana@lms.com',
			rollNumber: 'CS-2024-004',
		},
	];

	for (const s of studentsData) {
		await prisma.user.create({
			data: {
				name: s.name,
				email: s.email,
				password: password,
				role: 'STUDENT',
				rollNumber: s.rollNumber,
				active: true,
				createdById: instr1.id, // Let's say Angela enrolled them
			},
		});
	}
	console.log(
		`🎓 Created ${studentsData.length} Students (Password: pass1234)`,
	);

	console.log('✅ Seeding finished.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});