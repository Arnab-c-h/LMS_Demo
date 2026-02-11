const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');

const prisma = new PrismaClient();

//create quiz
//for lesso,modu,courses
exports.createQuiz = catchAsync(async (req, res, next) => {
	//1)where are we creating
	//we save to req.body as while creating quiz, we can pass as quiz.create({data:{req.body}})
	if (req.params.courseId) req.body.courseId = req.params.courseId;
	if (req.params.mopduleId) req.body.mopduleId = req.params.mopduleId;
	if (req.params.lessonId) req.body.lessonId = req.params.lessonId;

	const { title, passMark, lessonId, moduleId, courseId, questions } =
		req.body;

	//2)Validation
	//at least one ...Id
	if (!moduleId && !lessonId && !courseId) {
		return next(
			new AppError(
				`A quiz must be associated with a lesson, MOdule or a COurse`,
				400,
			),
		);
	}

	//3)Create Quiz(FINALLY!)
	//shell only
	const newQuiz = await prisma.quiz.create({
		data: {
			title,
			passMark: passMark || 30,
			lessonId,
			moduleId,
			courseId,
		},
	});

	res.status(201).json({
		status: 'success',
		data: { quiz: newQuiz },
	});
});

//Add Question ( one by one)
//ROUTE POST ..../quizzes/:quizId/questions
exports.addQuestion = catchAsync(async (req, res, next) => {
	const { quizId } = req.params;
	const { text, type, points, options } = req.body;

	//throw error
	if (!text || !options || options.length < 2) {
		return next(
			new AppError(
				'A question must have text and at least 2 options.',
				400,
			),
		);
	}

	const newQuestion = await prisma.question.create({
		data: {
			text,
			type: type || 'MULTIPLE CHOICE',
			points: points || 1,
			quizId,
			options: {
				create: options.map((opt) => ({
					text: opt.text,
					isCorrect: opt.isCorrect || false,
				})),
			},
		},

		include: { options: true },
	});

	res.status(201).json({
		status: 'success',
		data: { question: newQuestion },
	});
});

//Get Quiz
exports.getQuiz = catchAsync(async (req, res, next) => {
	const quiz = await prisma.quiz.findUnique({
		where: { id: req.params.quizId },
		include: {
			questions: {
				include: {
					options: {
						select: { id: true, text: true },
					},
				},
			},
		},
	});

	if (!quiz) return next(new AppError('No quiz found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: { quiz },
	});
});

//attempt quiz
exports.attemptQuiz = catchAsync(async (req, res, next) => {
	const { answers } = req.body;
	const { quizId } = req.params;
	const userId = req.user.id;

	if (!answers || !Array.isArray(answers)) {
		return next(new AppError('Please provide answers as an array.', 400));
	}

	//load quiz
	const quiz = await prisma.quiz.findUnique({
		where: { id: quizId },
		include: { questions: { include: { options: true } } },
	});

	if (!quiz) {
		return next(new AppError(`Quiz not found`, 404));
	}

	let score = 0;
	let totalPoints = 0;
	const questionMap = new Map();

	quiz.questions.forEach((q) => {
		totalPoints += q.points;
		questionMap.set(q.id, q);
	});

	for (const ans of answers) {
		if (!ans.questionId || !ans.optionId) continue;
		const question = questionMap.get(ans.questionId);
		if (question) {
			const selectedOption = question.options.find(
				(opt) => opt.id === ans.optionId,
			);
			if (selectedOption && selectedOption.isCorrect) {
				score += question.points;
			}
		}
	}
	const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
	const passed = percentage >= quiz.passMark;

	//save attempt
	const attempt = await prisma.quizAttempt.create({
		data: { score, passed, userId, quizId },
	});

	res.status(200).json({
		status: 'success',
		data: {
			score,
			totalPoints,
			percentage,
			passed,
			attempt,
		},
	});

});

//GET all Quizzes ( Helper )
    exports.getAllQuizzes = catchAsync(async (req, res, next) => {
		const filter = {};
		if (req.params.courseId) filter.courseId = req.params.courseId;
		if (req.params.moduleId) filter.moduleId = req.params.moduleId;
		if (req.params.lessonId) filter.lessonId = req.params.lessonId;
		const quizzes = await prisma.quiz.findMany({
			where: filter,
		});
		res.status(200).json({
			status: 'success',
			results: quizzes.length,
			data: { quizzes },
		});
	});