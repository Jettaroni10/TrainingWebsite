const loadData = (key) => JSON.parse(localStorage.getItem(key))

const { EDIT, STUDY, TEST } = {
    EDIT: 'edit-mode',
    STUDY: 'study-mode',
    TEST: 'test-mode',
};

let state = {
    currentMode: EDIT,
    categories: loadData('categories') || [],
    flashcards: loadData('flashcards') || [],
};

let studyCards = [];
let currentStudyCardIndex = 0;
let testCards = [];
let currentTestCardIndex = 0;
let correctAnswersCount = 0;

const getSelectedCategories = (containerId) =>
    Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(checkbox => checkbox.value);

const filterCardsByCategorySelection = (containerId) =>
    state.flashcards.filter(flashcard => getSelectedCategories(containerId).includes(flashcard.category));

function flipFlashcard() {
    document.querySelector('#flashcard .card').classList.toggle('flipped');
}


function displayFlashcard({ question, correctAnswer }) {
    const flashcardDiv = document.querySelector('#flashcard .card');
    flashcardDiv.classList.remove('flipped');
    document.querySelector('#flashcard .front').textContent = question;
    document.querySelector('#flashcard .back').textContent = correctAnswer;
}

function nextFlashcard() {
    if (currentStudyCardIndex < studyCards.length - 1) {
        displayFlashcard(studyCards[++currentStudyCardIndex]);
    } else {
        alert('You have finished all the flashcards.');
    }
}

function displayTestQuestion({ question, answers, correctAnswer }) {
    document.getElementById('question').textContent = question;
    const answersDiv = document.getElementById('answers');
    answersDiv.innerHTML = '';
    answers.forEach((answer, index) => {
        const answerHTML = `
            <div>
                <input type="radio" name="test-answer" id="answer-${index}" value="${answer}" onclick="checkAnswer('${answer}', '${correctAnswer}')">
                <label for="answer-${index}">${answer}</label>
            </div>`;
        answersDiv.insertAdjacentHTML('beforeend', answerHTML);
    });
}

function checkAnswer(selected, correct) {
    if (selected.trim() === correct.trim()) {
        correctAnswersCount++;
        alert('Correct!');
    } else {
        alert('Wrong! The correct answer is ' + correct);
    }
}

function nextQuestion() {
    currentTestCardIndex < testCards.length - 1 ? displayTestQuestion(testCards[++currentTestCardIndex]) : showTestResults();
}

const startStudyMode = () => {
    studyCards = filterCardsByCategorySelection('category-checkboxes');
    currentStudyCardIndex = 0;
    if (studyCards.length > 0) {
        displayFlashcard(studyCards[currentStudyCardIndex]);
    } else {
        alert('No cards available for the selected categories.');
    }
}


const startTestMode = () => {
    correctAnswersCount = 0;
    testCards = filterCardsByCategorySelection('test-category-checkboxes');
    currentTestCardIndex = 0;
    testCards.length && displayTestQuestion(testCards[currentTestCardIndex]);
}

function showTestResults() {
    const totalQuestions = testCards.length;
    const scorePercentage = Math.round((correctAnswersCount / totalQuestions) * 100);
    alert(`Test results: ${correctAnswersCount}/${totalQuestions} questions answered correctly. ${scorePercentage}%. ${scorePercentage >= 75 ? 'PASS' : 'FAIL'}`);
}

const toggleModal = () => document.getElementById('flashcard-modal').style.display =
    document.getElementById('flashcard-modal').style.display === 'block' ? 'none' : 'block';

window.addEventListener('click', event => {
    if (event.target === document.getElementById('flashcard-modal')) toggleModal();
});


function render() {
    renderCurrentMode();
    renderCategoryList();
    renderFlashcards();
    if (state.currentMode === STUDY) renderCategoryCheckboxes('category-checkboxes');
    if (state.currentMode === TEST) renderCategoryCheckboxes('test-category-checkboxes');
}

const renderCurrentMode = () => {
    Object.values({ EDIT, STUDY, TEST }).forEach(mode => {
        document.getElementById(mode).style.display = state.currentMode === mode ? 'block' : 'none';
    });
}

function switchMode(mode) {
    state.currentMode = mode;
    mode === STUDY && startStudyMode();
    mode === TEST && startTestMode();
    render();
}

function renderCategoryList() {
    const categoryList = document.getElementById('category-list');
    const dropdown = document.getElementById('flashcard-category');
    categoryList.innerHTML = '';
    dropdown.innerHTML = '';

    state.categories.forEach(category => {
        const listItemHTML = `
            <li>
                <span class="category-name">${category}</span>
                ${state.currentMode === EDIT ? `<span class="delete-btn" onclick="handleDeleteCategory('${category}')">-</span>` : ''}
            </li>`;
        categoryList.insertAdjacentHTML('beforeend', listItemHTML);

        dropdown.insertAdjacentHTML('beforeend', `<option value="${category}">${category}</option>`);
    });
}

function initialize() { render(); }

function handleDeleteCategory(category) {
    if (confirm(`Do you want to delete "${category}"? This will also delete all associated flashcards.`)) {
        state.categories = state.categories.filter(cat => cat !== category);
        state.flashcards = state.flashcards.filter(flashcard => flashcard.category !== category);
        saveData('categories', state.categories);
        saveData('flashcards', state.flashcards);
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    render();
}

;

const addCategory = () => {
    const categoryInput = document.getElementById("categoryInput").value.trim();
    if (categoryInput) {
        state.categories.push(categoryInput);
        saveData('categories', state.categories);
        document.getElementById("categoryInput").value = "";
    }
}

const addFlashcard = () => {
    const flashcard = {
        category: document.getElementById("flashcard-category").value,
        question: document.getElementById("flashcard-question").value,
        reference: document.getElementById("flashcard-data").value,
        answers: [...Array(+document.getElementById("choiceCount").value)]
            .map((_, i) => document.getElementById(`answer${i + 1}Input`).value)
            .filter(answer => answer.trim()),
        correctAnswer: document.getElementById(`answer${document.getElementById("correct-answer-dropdown").selectedIndex + 1}Input`).value,
        autofail: document.getElementById("autofail").checked,
        image: document.getElementById("question-image").files[0]
    };

    state.flashcards.push(flashcard);
    saveData('flashcards', state.flashcards);
}

function submitFlashcardForm() {
    addFlashcard();
    toggleModal();
    render();
}

function handleDrop(event) {
    event.preventDefault();
    if (event.dataTransfer.items) {
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            if (event.dataTransfer.items[i].kind === 'file') {
                const file = event.dataTransfer.items[i].getAsFile();
                console.log('Dropped file:', file.name);
            }
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
}

function renderFlashcards() {
    const flashcardsList = document.getElementById("questionList");
    flashcardsList.innerHTML = state.flashcards.map((flashcard, index) => `
        <li>
            ${flashcard.question}
            <button onclick="editFlashcard(${index})">Edit</button>
            <button onclick="deleteFlashcard(${index})">Delete</button>
        </li>
    `).join('');
}

const deleteFlashcard = index => {
    state.flashcards.splice(index, 1);
    saveData('flashcards', state.flashcards);
}

function editFlashcard(index) {
    const flashcard = state.flashcards[index];
    toggleModal();

    document.getElementById("flashcard-category").value = flashcard.category;
    document.getElementById("flashcard-question").value = flashcard.question;
    document.getElementById("flashcard-data").value = flashcard.reference;
    document.getElementById('choiceCount').value = flashcard.answers.length;

    updateAnswerFields();

    flashcard.answers.forEach((answer, i) => {
        document.getElementById(`answer${i + 1}Input`).value = answer;
    });
    document.getElementById("correct-answer-dropdown").value = flashcard.correctAnswer;
    document.getElementById("autofail").checked = flashcard.autofail;

    document.getElementById("flashcardSubmitBtn").onclick = () => {
        updateFlashcard(index);
        closeModal();
    };
}

const updateFlashcard = index => {
    const updatedFlashcard = {
    };
    state.flashcards[index] = updatedFlashcard;
    saveData('flashcards', state.flashcards);
}


function renderCategoryCheckboxes(containerId) {
    const checkboxContainer = document.getElementById(containerId);
    checkboxContainer.innerHTML = state.categories.map(category => `
        <label>
            ${category}
            <input type="checkbox" value="${category}" ${containerId === 'test-category-checkboxes' ? 'onchange="startTestMode()"' : ''}>
        </label>
    `).join('');
}


document.getElementById('choiceCount').addEventListener('change', updateAnswerFields);

function updateAnswerFields() {
    const count = +document.getElementById('choiceCount').value;
    const answerInputsDiv = document.getElementById('answerInputs');
    const correctAnswerDropdown = document.getElementById('correct-answer-dropdown');

    answerInputsDiv.innerHTML = [...Array(count)].map((_, i) => `
        <div>
            <label for="answer${i + 1}Input">Choice ${i + 1}:</label>
            <input type="text" id="answer${i + 1}Input" oninput="updateDropdownOptions(${i})"/>
        </div>
    `).join('');

    correctAnswerDropdown.innerHTML = [...Array(count)].map((_, i) => `<option value="Choice ${i + 1}">Choice ${i + 1}</option>`).join('');
}

const updateDropdownOptions = i => {
    const inputValue = document.getElementById(`answer${i + 1}Input`).value;
    const dropdownOption = document.getElementById('correct-answer-dropdown').options[i];
    dropdownOption.value = inputValue;
    dropdownOption.textContent = inputValue;
}
