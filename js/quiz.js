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

        // If the clicked item is already matched, unmatch it
        if (item.classList.contains('matched')) {
            // find the pair that contains this left/right index and remove it
            const pairIndex = selection.pairs.findIndex(p => {
                return (p.left === itemIndex && side === 'left') || (p.right === itemIndex && side === 'right');
            });
            if (pairIndex > -1) {
                const pair = selection.pairs.splice(pairIndex, 1)[0];
                // remove matched class from both elements
                const leftEl = document.getElementById(`match-${questionIndex}-left-${pair.left}`);
                const rightEl = document.getElementById(`match-${questionIndex}-right-${pair.right}`);
                if (leftEl) leftEl.classList.remove('matched');
                if (rightEl) rightEl.classList.remove('matched');
            }
            this.userAnswers[questionIndex] = selection.pairs;
            return;
        }

        if (side === 'left') {
            // mark the clicked left as the current selection
            document.querySelectorAll(`[id^="match-${questionIndex}-left-"]`).forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            selection.currentLeft = itemIndex;

            // If a right is already selected, create a persistent matched pair
            if (selection.currentRight !== undefined) {
                const leftIdx = selection.currentLeft;
                const rightIdx = selection.currentRight;
                selection.pairs.push({ left: leftIdx, right: rightIdx });

                const leftEl = document.getElementById(`match-${questionIndex}-left-${leftIdx}`);
                const rightEl = document.getElementById(`match-${questionIndex}-right-${rightIdx}`);
                if (leftEl) { leftEl.classList.remove('selected'); leftEl.classList.add('matched'); }
                if (rightEl) { rightEl.classList.remove('selected'); rightEl.classList.add('matched'); }

                selection.currentLeft = undefined;
                selection.currentRight = undefined;
            }
        } else {
            // right side selected
            document.querySelectorAll(`[id^="match-${questionIndex}-right-"]`).forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            selection.currentRight = itemIndex;

            if (selection.currentLeft !== undefined) {
                const leftIdx = selection.currentLeft;
                const rightIdx = selection.currentRight;
                selection.pairs.push({ left: leftIdx, right: rightIdx });

                const leftEl = document.getElementById(`match-${questionIndex}-left-${leftIdx}`);
                const rightEl = document.getElementById(`match-${questionIndex}-right-${rightIdx}`);
                if (leftEl) { leftEl.classList.remove('selected'); leftEl.classList.add('matched'); }
                if (rightEl) { rightEl.classList.remove('selected'); rightEl.classList.add('matched'); }

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

                // Evaluate each pair and add visual feedback
                userPairs.forEach(pair => {
                    const leftEl = document.getElementById(`match-${index}-left-${pair.left}`);
                    const rightEl = document.getElementById(`match-${index}-right-${pair.right}`);
                    // defensive checks
                    if (!rightEl) {
                        allCorrect = false;
                        return;
                    }

                    const leftItem = q.pairs[pair.left].left;
                    const rightItem = rightEl.dataset.value;
                    const correctRight = q.pairs.find(p => p.left === leftItem).right;

                    if (rightItem !== correctRight) {
                        allCorrect = false;
                        if (leftEl) leftEl.classList.add('incorrect');
                        if (rightEl) rightEl.classList.add('incorrect');
                    } else {
                        if (leftEl) leftEl.classList.add('correct');
                        if (rightEl) rightEl.classList.add('correct');
                    }
                });

                // mark any correct items that were missed
                const correctRightTexts = q.pairs.map(p => p.right);
                const selectedRightTexts = userPairs.map(p => {
                    const el = document.getElementById(`match-${index}-right-${p.right}`);
                    return el ? el.dataset.value : null;
                }).filter(Boolean);

                correctRightTexts.forEach((rightText, i) => {
                    if (!selectedRightTexts.includes(rightText)) {
                        // find the right element displaying this correct text (may be in shuffled position)
                        const rightEl = Array.from(document.querySelectorAll(`#question-${index} [id^="match-${index}-right-"]`)).find(e => e.dataset.value === rightText);
                        if (rightEl) rightEl.classList.add('missed');
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

// เพิ่มที่ท้ายไฟล์ quiz.js

// Password Ball Game
class PasswordBallGame {
    constructor() {
        this.balls = [
            { id: 1, text: 'รหัสผ่านควรมีความยาวมากกว่า 8 ตัวอักษร', correct: true },
            { id: 2, text: 'รหัสผ่านควรตั้งตามชื่อตัวเอง', correct: false },
            { id: 3, text: 'ควรผสมตัวพิมพ์ใหญ่และเล็ก', correct: true },
            { id: 4, text: 'ใช้รหัสผ่านเดียวกันทุกบัญชี', correct: false },
            { id: 5, text: 'ควรมีตัวเลขและสัญลักษณ์', correct: true },
            { id: 6, text: 'ตั้งเป็นวันเดือนปีเกิดเพื่อง่ายต่อการจำ', correct: false },
            { id: 7, text: 'เปลี่ยนรหัสผ่านเป็นประจำทุก 3-6 เดือน', correct: true },
            { id: 8, text: 'แชร์รหัสผ่านให้เพื่อนสนิทได้', correct: false },
            { id: 9, text: 'ใช้ Two-Factor Authentication (2FA)', correct: true },
            { id: 10, text: 'เขียนรหัสผ่านไว้ในโน้ตมือถือ', correct: false }
        ];
        this.selectedBalls = [];
        this.shuffledBalls = [];
    }

    init(containerId) {
        this.shuffledBalls = [...this.balls].sort(() => Math.random() - 0.5);
        this.selectedBalls = [];
        this.render(containerId);
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="password-ball-game">
                <div class="game-header">
                    <h3>🎮 เกมบอลรหัสผ่าน</h3>
                    <p>เลือกบอล 5 ลูกที่เป็นข้อมูลจริงเกี่ยวกับรหัสผ่านที่ดี</p>
                    <div class="score-counter">
                        <span class="selected-count">${this.selectedBalls.length}</span>/5 ลูก
                    </div>
                </div>
                
                <div class="ball-container">
                    ${this.shuffledBalls.map(ball => `
                        <div class="password-ball ${this.selectedBalls.includes(ball.id) ? 'selected' : ''}" 
                             data-ball-id="${ball.id}"
                             onclick="passwordBallGame.selectBall(${ball.id})">
                            <div class="ball-number">${ball.id}</div>
                            <div class="ball-text">${ball.text}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="box-container">
                    <div class="password-box">
                        <div class="box-title">📦 กล่องรหัสผ่านที่ดี</div>
                        <div class="box-content">
                            ${this.selectedBalls.map(id => {
                                const ball = this.balls.find(b => b.id === id);
                                return `
                                    <div class="selected-ball-item">
                                        <span class="ball-mini">${id}</span>
                                        <span class="ball-mini-text">${ball.text}</span>
                                        <button class="remove-btn" onclick="passwordBallGame.removeBall(${id})">×</button>
                                    </div>
                                `;
                            }).join('') || '<p class="empty-box">กล่องว่าง - เลือกบอล 5 ลูก</p>'}
                        </div>
                    </div>
                </div>

                <div class="game-actions">
                    <button class="btn" onclick="passwordBallGame.checkAnswer()" 
                            ${this.selectedBalls.length !== 5 ? 'disabled' : ''}>
                        ตรวจคำตอบ
                    </button>
                    <button class="btn btn-secondary" onclick="passwordBallGame.reset('${containerId}')">
                        เริ่มใหม่
                    </button>
                </div>

                <div id="gameResult" class="game-result"></div>
            </div>
        `;
    }

    selectBall(ballId) {
        if (this.selectedBalls.includes(ballId)) {
            this.removeBall(ballId);
            return;
        }

        if (this.selectedBalls.length >= 5) {
            alert('คุณเลือกครบ 5 ลูกแล้ว! กรุณาลบบอลที่ไม่ต้องการออกก่อน');
            return;
        }

        this.selectedBalls.push(ballId);
        this.updateDisplay();
    }

    removeBall(ballId) {
        this.selectedBalls = this.selectedBalls.filter(id => id !== ballId);
        this.updateDisplay();
    }

    updateDisplay() {
        const balls = document.querySelectorAll('.password-ball');
        balls.forEach(ball => {
            const ballId = parseInt(ball.dataset.ballId);
            if (this.selectedBalls.includes(ballId)) {
                ball.classList.add('selected');
            } else {
                ball.classList.remove('selected');
            }
        });

        const counter = document.querySelector('.selected-count');
        if (counter) counter.textContent = this.selectedBalls.length;

        const boxContent = document.querySelector('.box-content');
        if (boxContent) {
            boxContent.innerHTML = this.selectedBalls.map(id => {
                const ball = this.balls.find(b => b.id === id);
                return `
                    <div class="selected-ball-item">
                        <span class="ball-mini">${id}</span>
                        <span class="ball-mini-text">${ball.text}</span>
                        <button class="remove-btn" onclick="passwordBallGame.removeBall(${id})">×</button>
                    </div>
                `;
            }).join('') || '<p class="empty-box">กล่องว่าง - เลือกบอล 5 ลูก</p>';
        }

        const checkBtn = document.querySelector('.game-actions .btn:first-child');
        if (checkBtn) {
            checkBtn.disabled = this.selectedBalls.length !== 5;
        }
    }

    checkAnswer() {
        if (this.selectedBalls.length !== 5) {
            alert('กรุณาเลือกบอล 5 ลูก');
            return;
        }

        const correctBalls = this.balls.filter(b => b.correct).map(b => b.id);
        const selectedCorrect = this.selectedBalls.filter(id => correctBalls.includes(id));
        const selectedWrong = this.selectedBalls.filter(id => !correctBalls.includes(id));

        const score = selectedCorrect.length;
        const resultDiv = document.getElementById('gameResult');

        let resultHTML = `
            <div class="result-card ${score === 5 ? 'perfect' : score >= 3 ? 'good' : 'try-again'}">
                <div class="result-score">
                    <div class="score-circle">
                        <div class="score-number">${score}/5</div>
                    </div>
                </div>
                <h3>${score === 5 ? '🎉 เยี่ยมมาก!' : score >= 3 ? '👍 ดีมาก!' : '💪 ลองใหม่อีกครั้ง!'}</h3>
                <p>คุณเลือกถูก ${score} จาก 5 ลูก</p>
        `;

        if (selectedCorrect.length > 0) {
            resultHTML += `
                <div class="result-section correct-section">
                    <h4>✅ คำตอบที่ถูกต้อง:</h4>
                    <ul>
                        ${selectedCorrect.map(id => {
                            const ball = this.balls.find(b => b.id === id);
                            return `<li><strong>บอล ${id}:</strong> ${ball.text}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        if (selectedWrong.length > 0) {
            resultHTML += `
                <div class="result-section wrong-section">
                    <h4>❌ คำตอบที่ผิด:</h4>
                    <ul>
                        ${selectedWrong.map(id => {
                            const ball = this.balls.find(b => b.id === id);
                            return `<li><strong>บอล ${id}:</strong> ${ball.text}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;

            const missedCorrect = correctBalls.filter(id => !this.selectedBalls.includes(id));
            if (missedCorrect.length > 0) {
                resultHTML += `
                    <div class="result-section missed-section">
                        <h4>💡 คำตอบที่ถูกที่คุณพลาด:</h4>
                        <ul>
                            ${missedCorrect.map(id => {
                                const ball = this.balls.find(b => b.id === id);
                                return `<li><strong>บอล ${id}:</strong> ${ball.text}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `;
            }
        }

        resultHTML += `</div>`;
        resultDiv.innerHTML = resultHTML;

        // Highlight balls
        document.querySelectorAll('.password-ball').forEach(ball => {
            const ballId = parseInt(ball.dataset.ballId);
            const isCorrect = correctBalls.includes(ballId);
            const isSelected = this.selectedBalls.includes(ballId);

            ball.classList.remove('correct-ball', 'wrong-ball', 'missed-ball');
            
            if (isSelected) {
                if (isCorrect) {
                    ball.classList.add('correct-ball');
                } else {
                    ball.classList.add('wrong-ball');
                }
            } else if (isCorrect) {
                ball.classList.add('missed-ball');
            }
        });

        // Scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    reset(containerId) {
        this.init(containerId);
    }
}

const passwordBallGame = new PasswordBallGame();
