/**
 * Smart AI Assistant Pro - Interest Finder JavaScript
 * Handles quiz functionality and result display
 */

// Quiz Questions Data
const questions = [
    {
        question: "What type of work environment do you prefer?",
        category: "Work Style",
        options: [
            { text: "Working alone on complex problems", type: "Analytical" },
            { text: "Collaborating with a team", type: "Social" },
            { text: "Leading and managing others", type: "Leadership" },
            { text: "Creative and artistic projects", type: "Creative" }
        ]
    },
    {
        question: "Which activity excites you the most?",
        category: "Interests",
        options: [
            { text: "Building or fixing things", type: "Technical" },
            { text: "Helping others solve problems", type: "Helping" },
            { text: "Creating new ideas and designs", type: "Creative" },
            { text: "Analyzing data and finding patterns", type: "Analytical" }
        ]
    },
    {
        question: "How do you prefer to solve problems?",
        category: "Problem Solving",
        options: [
            { text: "Using logic and systematic approach", type: "Analytical" },
            { text: "Thinking outside the box creatively", type: "Creative" },
            { text: "Seeking help and collaboration", type: "Social" },
            { text: "Taking charge and making decisions", type: "Leadership" }
        ]
    },
    {
        question: "What motivates you most in a job?",
        category: "Motivation",
        options: [
            { text: "Financial stability and growth", type: "Practical" },
            { text: "Making a positive impact", type: "Helping" },
            { text: "Recognition and achievement", type: "Leadership" },
            { text: "Creative freedom and expression", type: "Creative" }
        ]
    },
    {
        question: "Which skill would you like to develop most?",
        category: "Skills",
        options: [
            { text: "Technical programming skills", type: "Technical" },
            { text: "Communication and persuasion", type: "Social" },
            { text: "Strategic thinking", type: "Leadership" },
            { text: "Artistic and design abilities", type: "Creative" }
        ]
    },
    {
        question: "How do you handle stress?",
        category: "Work Style",
        options: [
            { text: "Focus on one task at a time", type: "Analytical" },
            { text: "Talk it out with others", type: "Social" },
            { text: "Take charge of the situation", type: "Leadership" },
            { text: "Express through creative outlets", type: "Creative" }
        ]
    },
    {
        question: "What interests you most about technology?",
        category: "Interests",
        options: [
            { text: "How software and systems work", type: "Technical" },
            { text: "Using tech to help people", type: "Helping" },
            { text: "Building innovative products", type: "Creative" },
            { text: "Data and AI applications", type: "Analytical" }
        ]
    },
    {
        question: "Where do you see yourself in 10 years?",
        category: "Career Goals",
        options: [
            { text: "Expert in my technical field", type: "Technical" },
            { text: "Making a difference in community", type: "Helping" },
            { text: "In a leadership position", type: "Leadership" },
            { text: "Known for creative work", type: "Creative" }
        ]
    }
];

// State
let currentQuestion = 0;
let answers = [];

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const quizContainer = document.querySelector('.quiz-container');
const questionCard = document.getElementById('questionCard');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentQuestionSpan = document.getElementById('currentQuestion');
const totalQuestionsSpan = document.getElementById('totalQuestions');
const qNumberSpan = document.getElementById('qNumber');
const qCategorySpan = document.getElementById('qCategory');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const startQuizBtn = document.getElementById('startQuiz');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    totalQuestionsSpan.textContent = questions.length;
    
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startQuiz);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', goToPreviousQuestion);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', goToNextQuestion);
    }
});

// Start Quiz
function startQuiz() {
    welcomeScreen.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    currentQuestion = 0;
    answers = [];
    loadQuestion();
}

// Load Question
function loadQuestion() {
    const question = questions[currentQuestion];
    
    // Update UI
    questionText.textContent = question.question;
    qNumberSpan.textContent = currentQuestion + 1;
    qCategorySpan.textContent = question.category;
    currentQuestionSpan.textContent = currentQuestion + 1;
    
    // Update progress
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressFill.style.width = progress + '%';
    progressPercent.textContent = Math.round(progress) + '%';
    
    // Update buttons
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.innerHTML = currentQuestion === questions.length - 1 
        ? '<span>Submit</span><i class="fas fa-check"></i>'
        : '<span>Next</span><i class="fas fa-arrow-right"></i>';
    
    // Load options
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item' + (answers[currentQuestion] === index ? ' selected' : '');
        optionDiv.innerHTML = `
            <div class="option-circle"></div>
            <span class="option-text">${option.text}</span>
        `;
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });
}

// Select Option
function selectOption(index) {
    answers[currentQuestion] = index;
    
    // Update UI
    const options = optionsContainer.querySelectorAll('.option-item');
    options.forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
    });
}

// Go to Previous Question
function goToPreviousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

// Go to Next Question
function goToNextQuestion() {
    if (answers[currentQuestion] === undefined) {
        alert('Please select an option to continue.');
        return;
    }
    
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
    } else {
        submitQuiz();
    }
}

// Submit Quiz
async function submitQuiz() {
    const results = calculateResults();
    
    await fetch('/interest/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
    });
    
    window.location.href = '/interest/result';
}

// Calculate Results
function calculateResults() {
    const typeCounts = {
        Analytical: 0,
        Creative: 0,
        Social: 0,
        Leadership: 0,
        Technical: 0,
        Helping: 0,
        Practical: 0
    };
    
    answers.forEach((answerIndex, questionIndex) => {
        const option = questions[questionIndex].options[answerIndex];
        typeCounts[option.type]++;
    });
    
    // Find top types
    const sortedTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const primaryType = sortedTypes[0][0];
    const secondaryType = sortedTypes[1][0];
    
    // Generate results based on types
    return generateResults(primaryType, secondaryType, typeCounts);
}

// Generate Results
function generateResults(primaryType, secondaryType, typeCounts) {
    const personalityData = {
        'Analytical': {
            title: 'The Strategic Thinker',
            description: 'You have a natural ability to process complex information and find logical solutions. Your analytical mind makes you excellent at data-driven decision making and strategic planning.',
            strengths: ['Problem Solving', 'Critical Thinking', 'Data Analysis', 'Research', 'Logical Reasoning']
        },
        'Creative': {
            title: 'The Visionary Creator',
            description: 'You see possibilities where others see obstacles. Your creative thinking brings innovative solutions and fresh perspectives to any challenge. You thrive in environments that value imagination.',
            strengths: ['Innovation', 'Design Thinking', 'Artistic Expression', 'Out-of-the-box Thinking', 'Creativity']
        },
        'Social': {
            title: 'The Empathetic Connector',
            description: 'You thrive on human connection and have a natural ability to understand and help others. Your interpersonal skills make you valuable in any team environment.',
            strengths: ['Communication', 'Empathy', 'Collaboration', 'Conflict Resolution', 'Team Building']
        },
        'Leadership': {
            title: 'The Influential Leader',
            description: 'You have a natural ability to guide and inspire others. Your leadership qualities help teams achieve their goals and reach their potential.',
            strengths: ['Decision Making', 'Strategic Planning', 'Motivation', 'Team Management', 'Vision']
        },
        'Technical': {
            title: 'The Master Builder',
            description: 'You have a natural talent for understanding how things work and building practical solutions. Your technical skills enable you to create innovative products and systems.',
            strengths: ['Technical Proficiency', 'Problem Solving', 'System Design', 'Innovation', 'Attention to Detail']
        },
        'Helping': {
            title: 'The Compassionate Helper',
            description: 'You find deep satisfaction in making a positive impact on others\' lives. Your empathy and dedication make you an invaluable support to those around you.',
            strengths: ['Empathy', 'Patience', 'Communication', 'Problem Solving', 'Support']
        },
        'Practical': {
            title: 'The Pragmatic Achiever',
            description: 'You have a realistic approach to life and work. Your practical mindset helps you make sound decisions and achieve tangible results.',
            strengths: ['Financial Acumen', 'Planning', 'Organization', 'Realistic Thinking', 'Goal Setting']
        }
    };
    
    const skillsData = {
        'Analytical': ['Data Analysis', 'Research Methods', 'Statistical Thinking', 'Logical Reasoning', 'Problem Solving'],
        'Creative': ['Design Thinking', 'Creative Writing', 'Visual Design', 'Innovation', 'Brainstorming'],
        'Social': ['Public Speaking', 'Team Collaboration', 'Active Listening', 'Conflict Resolution', 'Mentoring'],
        'Leadership': ['Strategic Planning', 'Decision Making', 'Team Management', 'Project Management', 'Negotiation'],
        'Technical': ['Programming', 'System Architecture', 'Debugging', 'Technical Writing', 'Automation'],
        'Helping': ['Counseling', 'Teaching', 'Customer Service', 'Community Outreach', 'Support Services'],
        'Practical': ['Time Management', 'Budgeting', 'Organization', 'Risk Assessment', 'Goal Setting']
    };
    
    const coursesData = {
        'Analytical': [
            { title: 'Data Science Fundamentals', level: 'Beginner', description: 'Learn the basics of data analysis and interpretation.' },
            { title: 'Advanced Statistics', level: 'Advanced', description: 'Master statistical methods for research and analysis.' },
            { title: 'Business Intelligence', level: 'Intermediate', description: 'Transform data into actionable business insights.' }
        ],
        'Creative': [
            { title: 'UI/UX Design Principles', level: 'Beginner', description: 'Create user-centered designs that delight users.' },
            { title: 'Creative Writing Workshop', level: 'Intermediate', description: 'Develop your creative writing skills.' },
            { title: 'Digital Art Mastery', level: 'Advanced', description: 'Master digital art tools and techniques.' }
        ],
        'Social': [
            { title: 'Effective Communication', level: 'Beginner', description: 'Improve your verbal and written communication skills.' },
            { title: 'Leadership Essentials', level: 'Intermediate', description: 'Develop essential leadership qualities.' },
            { title: 'Team Dynamics', level: 'Advanced', description: 'Understand and optimize team performance.' }
        ],
        'Leadership': [
            { title: 'Strategic Management', level: 'Beginner', description: 'Learn strategic planning and execution.' },
            { title: 'Project Management Professional', level: 'Intermediate', description: 'Master project management methodologies.' },
            { title: 'Executive Leadership', level: 'Advanced', description: 'Develop executive-level leadership skills.' }
        ],
        'Technical': [
            { title: 'Python Programming', level: 'Beginner', description: 'Start your coding journey with Python.' },
            { title: 'Web Development Bootcamp', level: 'Intermediate', description: 'Build modern web applications from scratch.' },
            { title: 'Machine Learning', level: 'Advanced', description: 'Dive deep into AI and machine learning concepts.' }
        ],
        'Helping': [
            { title: 'Life Coaching Basics', level: 'Beginner', description: 'Learn coaching techniques to help others.' },
            { title: 'Social Work Fundamentals', level: 'Intermediate', description: 'Understand social work principles and practices.' },
            { title: 'Community Development', level: 'Advanced', description: 'Lead impactful community initiatives.' }
        ],
        'Practical': [
            { title: 'Financial Literacy', level: 'Beginner', description: 'Master personal and business finance basics.' },
            { title: 'Productivity Mastery', level: 'Intermediate', description: 'Boost your productivity and efficiency.' },
            { title: 'Business Strategy', level: 'Advanced', description: 'Develop comprehensive business strategies.' }
        ]
    };
    
    const careersData = {
        'Analytical': [
            { icon: 'fas fa-chart-bar', title: 'Data Analyst', description: 'Analyze complex data to drive business decisions.', growth: 'High Growth', salary: '$65K - $95K' },
            { icon: 'fas fa-microscope', title: 'Research Scientist', description: 'Conduct research to advance scientific knowledge.', growth: 'Stable', salary: '$70K - $110K' },
            { icon: 'fas fa-calculator', title: 'Financial Analyst', description: 'Evaluate financial data and trends.', growth: 'Moderate', salary: '$60K - $90K' }
        ],
        'Creative': [
            { icon: 'fas fa-palette', title: 'UI/UX Designer', description: 'Create intuitive and beautiful user interfaces.', growth: 'High Growth', salary: '$70K - $120K' },
            { icon: 'fas fa-pen-nib', title: 'Content Creator', description: 'Produce engaging content for digital platforms.', growth: 'High Growth', salary: '$50K - $100K' },
            { icon: 'fas fa-film', title: 'Creative Director', description: 'Lead creative teams and vision.', growth: 'Moderate', salary: '$80K - $150K' }
        ],
        'Social': [
            { icon: 'fas fa-users', title: 'HR Manager', description: 'Manage human resources and employee relations.', growth: 'Stable', salary: '$65K - $110K' },
            { icon: 'fas fa-chalkboard-teacher', title: 'Trainer/Educator', description: 'Teach and develop others\' skills.', growth: 'Stable', salary: '$50K - $80K' },
            { icon: 'fas fa-hand-holding-heart', title: 'Social Worker', description: 'Support individuals and communities.', growth: 'Moderate', salary: '$45K - $70K' }
        ],
        'Leadership': [
            { icon: 'fas fa-briefcase', title: 'Project Manager', description: 'Lead projects from inception to completion.', growth: 'High Growth', salary: '$75K - $130K' },
            { icon: 'fas fa-building', title: 'Business Executive', description: 'Drive organizational strategy and growth.', growth: 'High Growth', salary: '$100K - $200K+' },
            { icon: 'fas fa-rocket', title: 'Entrepreneur', description: 'Build and scale your own business.', growth: 'Variable', salary: 'Variable' }
        ],
        'Technical': [
            { icon: 'fas fa-code', title: 'Software Developer', description: 'Build applications and systems.', growth: 'High Growth', salary: '$80K - $150K' },
            { icon: 'fas fa-server', title: 'System Administrator', description: 'Manage and maintain IT infrastructure.', growth: 'Stable', salary: '$65K - $100K' },
            { icon: 'fas fa-shield-alt', title: 'Cybersecurity Analyst', description: 'Protect systems from cyber threats.', growth: 'High Growth', salary: '$90K - $140K' }
        ],
        'Helping': [
            { icon: 'fas fa-hands-helping', title: 'Counselor', description: 'Provide guidance and support.', growth: 'Moderate', salary: '$50K - $80K' },
            { icon: 'fas fa-user-md', title: 'Healthcare Professional', description: 'Provide medical care and support.', growth: 'Stable', salary: '$60K - $150K' },
            { icon: 'fas fa-people-carry', title: 'Community Manager', description: 'Build and support communities.', growth: 'Moderate', salary: '$55K - $90K' }
        ],
        'Practical': [
            { icon: 'fas fa-briefcase', title: 'Business Analyst', description: 'Bridge business needs with solutions.', growth: 'High Growth', salary: '$70K - $110K' },
            { icon: 'fas fa-clipboard-check', title: 'Operations Manager', description: 'Optimize business operations.', growth: 'Stable', salary: '$65K - $100K' },
            { icon: 'fas fa-coins', title: 'Financial Manager', description: 'Manage financial planning and strategy.', growth: 'Moderate', salary: '$80K - $130K' }
        ]
    };
    
    // Get data based on primary type
    const data = personalityData[primaryType] || personalityData['Analytical'];
    
    // Return complete results object
    return {
        personality_type: primaryType,
        personality_title: data.title,
        personality_description: data.description,
        strengths: data.strengths,
        skills: skillsData[primaryType] || skillsData['Analytical'],
        courses: coursesData[primaryType] || coursesData['Analytical'],
        careers: careersData[primaryType] || careersData['Analytical']
    };
}

// Make functions globally available
window.startQuiz = startQuiz;
window.goToPreviousQuestion = goToPreviousQuestion;
window.goToNextQuestion = goToNextQuestion;
window.submitQuiz = submitQuiz;