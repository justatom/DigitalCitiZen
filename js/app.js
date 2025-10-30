// Main Application
class DigitalCitizenApp {
  constructor() {
    this.userProgress = {
      completedLessons: [],
      scores: {},
      totalScore: 0,
      userName: "",
    };
    this.loadProgress();
  }

  init() {
    this.renderLessons();
    this.updateProgressBar();
  }

  loadProgress() {
    const saved = localStorage.getItem("digitalCitizenProgress");
    if (saved) {
      this.userProgress = JSON.parse(saved);
    }
  }

  saveProgress() {
    localStorage.setItem(
      "digitalCitizenProgress",
      JSON.stringify(this.userProgress)
    );
  }

  updateProgress(lessonId, score) {
    if (!this.userProgress.completedLessons.includes(lessonId)) {
      this.userProgress.completedLessons.push(lessonId);
    }
    this.userProgress.scores[lessonId] = score;

    // Calculate total score
    const scores = Object.values(this.userProgress.scores);
    this.userProgress.totalScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    this.saveProgress();
    this.updateProgressBar();

    // Check for certificate
    if (
      this.userProgress.completedLessons.length === LESSONS_DATA.length &&
      this.userProgress.totalScore >= 80
    ) {
      setTimeout(() => this.showCertificate(), 1000);
    }
  }

  updateProgressBar() {
    const completed = this.userProgress.completedLessons.length;
    const total = LESSONS_DATA.length;
    const percentage = (completed / total) * 100;

    const progressFill = document.getElementById("progressFill");
    const progressStats = document.getElementById("progressStats");
    const totalScore = document.getElementById("totalScore");

    if (progressFill) progressFill.style.width = percentage + "%";
    if (progressStats) progressStats.textContent = `${completed}/${total} บท`;
    if (totalScore) totalScore.textContent = this.userProgress.totalScore;
  }

  renderLessons() {
    const grid = document.getElementById("lessonsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    LESSONS_DATA.forEach((lesson, index) => {
      const isCompleted = this.userProgress.completedLessons.includes(lesson.id);

      // Unlock all lessons: remove locking logic so every lesson is accessible
      const card = document.createElement("div");
      card.className = "lesson-card";

      // Make every card clickable (open lesson modal)
      card.onclick = () => this.openLesson(lesson.id);

      let status = "";
      if (isCompleted) {
        status = `<span class="lesson-status completed">✓ เรียนจบแล้ว</span>`;
      } else {
        // No locking: show available for all non-completed lessons
        status = `<span class="lesson-status available">▶ เริ่มเรียน</span>`;
      }

      const scoreDisplay = isCompleted
        ? `<span class="lesson-score">คะแนน: ${
            this.userProgress.scores[lesson.id]
          }%</span>`
        : "";

      card.innerHTML = `
                <div class="lesson-header">
                    <div class="lesson-number">${String(lesson.id).padStart(
                      2,
                      "0"
                    )}</div>
                    <div class="lesson-icon">${lesson.icon}</div>
                </div>
                <h3 class="lesson-title">${lesson.title}</h3>
                <p class="lesson-description">${lesson.description}</p>
                <div class="lesson-footer">
                    ${status}
                    ${scoreDisplay}
                </div>
            `;

      grid.appendChild(card);
    });
  }

  openLesson(lessonId) {
    const lesson = LESSONS_DATA.find((l) => l.id === lessonId);
    if (!lesson) return;

    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");

    modalContent.innerHTML = `
            <div class="lesson-content">
                ${lesson.content}
            </div>
        `;

    // Add quiz
    const quizSection = quizManager.renderQuiz(lesson.quiz, lessonId);
    modalContent.appendChild(quizSection);

    // Add Fun Facts section for lesson 1
    if (lessonId === 1) {
      const funFactsSection = document.createElement('div');
      funFactsSection.innerHTML = `
        <div class="fun-facts">
          <h2>Fun Facts: พฤติกรรมการแชร์ของคนไทย</h2>
          <div class="fun-facts-grid">
              <div class="fact-card">
                  <div class="fact-stat">53%+</div>
                  <div class="fact-text">คนไทยพบแบรนด์ใหม่ ๆ จากการแชร์ในโซเชียลมีเดีย</div>
                  <div class="fact-detail">เมื่อโพสต์ "ไวรัล" ถูกแชร์ต่อหลาย ๆ ครั้ง สามารถทำให้แบรนด์หรือบุคคลดังแบบข้ามคืนได้ทันที</div>
              </div>
              <div class="fact-card">
                  <div class="fact-stat">56.9%</div>
                  <div class="fact-text">แชร์โพสต์เพื่อติดต่อกับเพื่อนและครอบครัว</div>
                  <div class="fact-detail">สถิติปี 2025 พบว่าผู้ใช้งานส่วนใหญ่แชร์หรือพูดคุยความคิดเห็นกับผู้อื่นบนโซเชียลเพื่อการเชื่อมต่อกัน</div>
              </div>
              <div class="fact-card">
                  <div class="fact-stat">29.7%</div>
                  <div class="fact-text">แชร์โพสต์เพื่อแบ่งปันหรือถกเถียงความคิดเห็น</div>
                  <div class="fact-detail">คนไทยนิยมแชร์ข่าวสาร ความรู้ และแรงบันดาลใจมากกว่าการแสดงความคิดเห็นส่วนตัว</div>
              </div>
              <div class="fact-card">
                  <div class="fact-stat">18:00-20:00</div>
                  <div class="fact-text">"ช่วงเวลาทอง" สำหรับการโพสต์ในวันศุกร์</div>
                  <div class="fact-detail">โพสต์ในช่วงนี้จะถูกแชร์และมองเห็นมากกว่าเวลาปกติ เพราะคนส่วนใหญ่ใช้โซเชียลหลังเลิกงานหรือก่อนพักผ่อน</div>
              </div>
              <div class="fact-card">
                  <div class="fact-stat">2:30+ ชม.</div>
                  <div class="fact-text">เวลาเฉลี่ยต่อวันที่คนไทยใช้บน social network</div>
                  <div class="fact-detail">คนไทยโดยเฉลี่ยใช้ social network รวม 7 แพลตฟอร์ม/บุคคล ต่อเดือน</div>
              </div>
          </div>
        </div>
      `;
      modalContent.appendChild(funFactsSection);
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Initialize game if exists
    if (lesson.hasGame && lesson.gameId) {
      setTimeout(() => {
        if (lesson.gameId === 'passwordBallGameContainer' && typeof passwordBallGame !== 'undefined') {
          passwordBallGame.init(lesson.gameId);
        } else if (lesson.gameId === 'shareSortGameContainer' && typeof shareSortGame !== 'undefined') {
          shareSortGame.init(lesson.gameId);
        } else if (typeof passwordBallGame !== 'undefined') {
          // fallback to passwordBallGame if available
          passwordBallGame.init(lesson.gameId);
        }
      }, 100);
    }
  }

  showCertificate() {
    let userName = this.userProgress.userName;
    if (!userName) {
      userName = prompt("กรุณาใส่ชื่อของคุณสำหรับใบประกาศนียบัตร:", "");
      if (!userName) return;
      this.userProgress.userName = userName;
      this.saveProgress();
    }

    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateModal = document.getElementById("certificateModal");
    const certificateContent = document.getElementById("certificateContent");

    certificateContent.innerHTML = `
            <div class="certificate">
                <h2>ใบประกาศนียบัตร</h2>
                <p class="certificate-text">ขอมอบให้</p>
                <div class="certificate-name">${userName}</div>
                <p class="certificate-text">
                    ได้สำเร็จการเรียนหลักสูตร<br>
                    <strong style="color: var(--accent-primary); font-size: 1.3em;">Digital Citizen: Be Internet Awesome</strong><br>
                    ผ่านการทดสอบครบทั้ง ${LESSONS_DATA.length} บท<br>
                    ด้วยคะแนนรวม <span style="color: var(--accent-secondary); font-size: 1.3em; font-weight: 700;">${this.userProgress.totalScore}%</span>
                </p>
                <div class="certificate-footer">
                    <div>
                        <p style="color: var(--text-muted);">วันที่สำเร็จการเรียน</p>
                        <p style="font-weight: 700; color: var(--text-primary);">${today}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-muted);">ลายเซ็น</p>
                        <p style="font-family: var(--font-display); font-size: 1.3em; color: var(--accent-primary);">Digital Citizen</p>
                    </div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn" onclick="window.print()">🖨️ พิมพ์ใบประกาศนียบัตร</button>
                <button class="btn btn-secondary" onclick="closeCertificateModal()">ปิด</button>
            </div>
        `;

    certificateModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Global Functions
function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function closeCertificateModal() {
  const modal = document.getElementById("certificateModal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Initialize App
const app = new DigitalCitizenApp();
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});

// Close modal on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeCertificateModal();
  }
});
