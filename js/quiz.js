// Quiz Management
class QuizManager {
    constructor() {
        this.userAnswers = {};
        this.matchingSelections = {};
        this.currentLessonId = null;
    }

    initialize(lessonId) {
        this.currentLessonId = lessonId;
        this.userAnswers = {};
        this.matchingSelections = {};
    }

    renderQuiz(quiz, lessonId) {
        this.initialize(lessonId);
        const container = document.createElement('div');
        container.className = 'quiz-section';
        container.innerHTML = `
            <h2>📝 แบบทดสอบท้ายบท</h2>
            <div id="quizContainer"></div>
            <div class="btn-group">
                <button class="btn" onclick="quizManager.submitQuiz()">ส่งคำตอบ</button>
                <button class="btn btn-secondary" onclick="closeModal()">ปิด</button>
            </div>
        `;

        const quizContainer = container.querySelector('#quizContainer');
        quiz.forEach((q, index) => {
            quizContainer.appendChild(this.createQuestion(q, index));
        });

        return container;
    }

    createQuestion(question, index) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        questionDiv.id = `question-${index}`;

        const typeLabel = this.getQuestionTypeLabel(question.type);
        let questionHTML = `
            <span class="question-type">${typeLabel}</span>
            <div class="question-text">${index + 1}. ${question.question}</div>
        `;

        if (question.type === 'single') {
            questionHTML += this.createSingleChoice(question, index);
        } else if (question.type === 'multiple') {
            questionHTML += this.createMultipleChoice(question, index);
        } else if (question.type === 'matching') {
            questionHTML += this.createMatching(question, index);
        } else if (question.type === 'fill') {
            questionHTML = `
                <span class="question-type">${typeLabel}</span>
                <div class="question-text">${index + 1}. ${this.createFillBlank(question, index)}</div>
            `;
        }

        questionDiv.innerHTML = questionHTML;
        return questionDiv;
    }

    getQuestionTypeLabel(type) {
        const labels = {
            'single': 'เลือกตอบข้อเดียว',
            'multiple': 'เลือกหลายข้อ',
            'matching': 'จับคู่',
            'fill': 'เติมคำ'
        };
        return labels[type] || type;
    }

    createSingleChoice(question, index) {
        let html = '<div class="options">';
        question.options.forEach((opt, i) => {
            html += `
                <div class="option" onclick="quizManager.selectSingle(${index}, ${i})">
                    ${opt}
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    createMultipleChoice(question, index) {
        let html = '<div class="options">';
        question.options.forEach((opt, i) => {
            html += `
                <div class="option" onclick="quizManager.selectMultiple(${index}, ${i})">
                    <input type="checkbox" id="q${index}-opt${i}" style="pointer-events: none;">
                    <label for="q${index}-opt${i}" style="cursor: pointer; pointer-events: none; flex: 1;">${opt}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    createMatching(question, index) {
        const shuffled = [...question.pairs].sort(() => Math.random() - 0.5);
        let html = '<div class="matching-container">';
        html += '<div>';
        question.pairs.forEach((pair, i) => {
            html += `<div class="match-item" onclick="quizManager.selectMatch(${index}, ${i}, 'left')" id="match-${index}-left-${i}">${pair.left}</div>`;
        });
        html += '</div><div>';
        shuffled.forEach((pair, i) => {
            html += `<div class="match-item" onclick="quizManager.selectMatch(${index}, ${i}, 'right')" id="match-${index}-right-${i}" data-value="${pair.right}">${pair.right}</div>`;
        });
        html += '</div></div>';
        return html;
    }

    createFillBlank(question, index) {
        const parts = question.question.split('___________');
        return `${parts[0]}<input type="text" class="fill-blank-input" id="fill-${index}" onkeypress="if(event.key==='Enter')quizManager.submitQuiz()">${parts[1] || ''}`;
    }

    selectSingle(questionIndex, optionIndex) {
        const options = document.querySelectorAll(`#question-${questionIndex} .option`);
        options.forEach(opt => opt.classList.remove('selected'));
        options[optionIndex].classList.add('selected');
        this.userAnswers[questionIndex] = optionIndex;
    }

    selectMultiple(questionIndex, optionIndex) {
        const option = document.querySelectorAll(`#question-${questionIndex} .option`)[optionIndex];
        const checkbox = option.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        option.classList.toggle('selected');

        if (!this.userAnswers[questionIndex]) this.userAnswers[questionIndex] = [];
        const idx = this.userAnswers[questionIndex].indexOf(optionIndex);
        if (idx > -1) {
            this.userAnswers[questionIndex].splice(idx, 1);
        } else {
            this.userAnswers[questionIndex].push(optionIndex);
        }
    }

    selectMatch(questionIndex, itemIndex, side) {
        if (!this.matchingSelections[questionIndex]) {
            this.matchingSelections[questionIndex] = { pairs: [] };
        }

        const selection = this.matchingSelections[questionIndex];
        const itemId = `match-${questionIndex}-${side}-${itemIndex}`;
        const item = document.getElementById(itemId);

        if (side === 'left') {
            document.querySelectorAll(`[id^="match-${questionIndex}-left-"]`).forEach(el => {
                el.classList.remove('selected');
            });
            item.classList.add('selected');
            selection.currentLeft = itemIndex;

            if (selection.currentRight !== undefined) {
                selection.pairs.push({ 
                    left: selection.currentLeft, 
                    right: selection.currentRight 
                });
                document.getElementById(`match-${questionIndex}-right-${selection.currentRight}`).classList.remove('selected');
                item.classList.remove('selected');
                selection.currentLeft = undefined;
                selection.currentRight = undefined;
            }
        } else {
            document.querySelectorAll(`[id^="match-${questionIndex}-right-"]`).forEach(el => {
                el.classList.remove('selected');
            });
            item.classList.add('selected');
            selection.currentRight = itemIndex;

            if (selection.currentLeft !== undefined) {
                selection.pairs.push({ 
                    left: selection.currentLeft, 
                    right: selection.currentRight 
                });
                document.getElementById(`match-${questionIndex}-left-${selection.currentLeft}`).classList.remove('selected');
                item.classList.remove('selected');
                selection.currentLeft = undefined;
                selection.currentRight = undefined;
            }
        }

        this.userAnswers[questionIndex] = selection.pairs;
    }

    submitQuiz() {
        const lesson = LESSONS_DATA.find(l => l.id === this.currentLessonId);
        let score = 0;
        const totalQuestions = lesson.quiz.length;

        lesson.quiz.forEach((q, index) => {
            if (q.type === 'single') {
                if (this.userAnswers[index] === q.correct) {
                    score++;
                    this.markCorrect(index, this.userAnswers[index]);
                } else {
                    if (this.userAnswers[index] !== undefined) {
                        this.markIncorrect(index, this.userAnswers[index]);
                    }
                    this.markCorrect(index, q.correct);
                }
            } else if (q.type === 'multiple') {
                const userAns = this.userAnswers[index] || [];
                const correctAns = q.correct;
                if (this.arraysEqual(userAns.sort(), correctAns.sort())) {
                    score++;
                    userAns.forEach(i => this.markCorrect(index, i));
                } else {
                    userAns.forEach(i => {
                        if (!correctAns.includes(i)) {
                            this.markIncorrect(index, i);
                        }
                    });
                    correctAns.forEach(i => this.markCorrect(index, i));
                }
            } else if (q.type === 'matching') {
                const userPairs = this.userAnswers[index] || [];
                let allCorrect = userPairs.length === q.pairs.length;
                
                userPairs.forEach(pair => {
                    const leftItem = q.pairs[pair.left].left;
                    const rightElement = document.getElementById(`match-${index}-right-${pair.right}`);
                    const rightItem = rightElement.dataset.value;
                    const correctRight = q.pairs.find(p => p.left === leftItem).right;
                    if (rightItem !== correctRight) {
                        allCorrect = false;
                    }
                });
                
                if (allCorrect) score++;
            } else if (q.type === 'fill') {
                const input = document.getElementById(`fill-${index}`);
                const userAnswer = input.value.trim().toLowerCase();
                const correctAnswer = q.answer.toLowerCase();
                if (userAnswer === correctAnswer || userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
                    score++;
                    input.style.borderColor = 'var(--success)';
                    input.style.background = 'rgba(0, 255, 136, 0.1)';
                } else {
                    input.style.borderColor = 'var(--error)';
                    input.style.background = 'rgba(255, 0, 85, 0.1)';
                }
            }
        });

        const percentage = Math.round((score / totalQuestions) * 100);
        this.showScore(score, totalQuestions, percentage);
        app.updateProgress(this.currentLessonId, percentage);
    }

    markCorrect(questionIndex, optionIndex) {
        const options = document.querySelectorAll(`#question-${questionIndex} .option`);
        if (options[optionIndex]) {
            options[optionIndex].classList.add('correct');
        }
    }

    markIncorrect(questionIndex, optionIndex) {
        const options = document.querySelectorAll(`#question-${questionIndex} .option`);
        if (options[optionIndex]) {
            options[optionIndex].classList.add('incorrect');
        }
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    showScore(score, total, percentage) {
        const quizSection = document.querySelector('.quiz-section');
        const isPassed = percentage >= 80;
        
        const scoreHTML = `
            <div class="score-display">
                <h2>ผลคะแนน</h2>
                <div class="score-number">${percentage}%</div>
                <p class="score-message">คุณตอบถูก ${score} จาก ${total} ข้อ</p>
                <p class="score-result ${isPassed ? 'pass' : 'fail'}">
                    ${isPassed ? '🎉 ยินดีด้วย! คุณผ่านบทเรียนนี้แล้ว' : '💪 ลองใหม่อีกครั้งเพื่อทำคะแนนให้ดีขึ้น'}
                </p>
                <div class="btn-group">
                    <button class="btn" onclick="closeModal(); app.renderLessons();">ปิด</button>
                    ${!isPassed ? '<button class="btn btn-secondary" onclick="location.reload()">ลองใหม่</button>' : ''}
                </div>
            </div>
        `;

        quizSection.innerHTML = scoreHTML;
    }
}

const quizManager = new QuizManager();
