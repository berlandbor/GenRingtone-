const grid = document.getElementById("grid");
const playButton = document.getElementById("play");
const clearButton = document.getElementById("clear");
const notesContainer = document.getElementById("notes");
const speedControl = document.getElementById("speed");
const volumeControl = document.getElementById("volume");
const waveTypeSelect = document.getElementById("waveType");
const saveButton = document.getElementById("save");
const loadButton = document.getElementById("load");
const loopCheckbox = document.getElementById("loop");
let isPlaying = false;
const notes = [
    "C2", "D2", "E2", "F2", "G2", "A2", "B2", // Вторая октава
    "C3", "D3", "E3", "F3", "G3", "A3", "B3", // Третья октава
    "C4", "D4", "E4", "F4", "G4", "A4", "B4", // Четвертая октава
    "C5", "D5", "E5", "F5", "G5", "A5", "B5", // Пятая октава
    "C6", "D6", "E6", "F6", "G6", "A6", "B6"  // Шестая октава
];
const rows = notes.length;
const cols = 16;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let activeCells = Array(rows).fill(null).map(() => Array(cols).fill(false));
let durations = Array(rows).fill(null).map(() => Array(cols).fill(300)); // Храним длительность каждой ноты
let playbackQueue = [];
let isLooping = false;
let savedMelody = [];

// Добавляем отображение нот
notes.forEach((note) => {
    const noteLabel = document.createElement("div");
    noteLabel.textContent = note;
    noteLabel.style.height = "30px";
    noteLabel.style.display = "flex";
    noteLabel.style.alignItems = "center";
    noteLabel.style.justifyContent = "flex-end";
    noteLabel.style.marginRight = "10px";
    notesContainer.appendChild(noteLabel);
});

// Создаем HTML-ячейки
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;

        // Всплывающее окно для задания длительности
        cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const duration = prompt("Введите длительность ноты (мс):", durations[i][j]);
            if (duration && !isNaN(duration)) {
                durations[i][j] = parseInt(duration);
            }
        });

        grid.appendChild(cell);
    }
}

// Обработка кликов по ячейкам
grid.addEventListener("click", (e) => {
    const cell = e.target;
    if (cell.classList.contains("cell")) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (activeCells[row][col]) {
            // Удаляем из очереди
            playbackQueue = playbackQueue.filter(item => !(item.row === row && item.col === col));
        } else {
            // Добавляем в очередь
            playbackQueue.push({ row, col });
        }

        activeCells[row][col] = !activeCells[row][col];
        cell.classList.toggle("active");
    }
});

// Воспроизведение нот в порядке очереди
playButton.addEventListener("click", () => {
    if (isPlaying) {
        stopPlayback(); // Останавливаем текущую мелодию
    }
    startPlayback(); // Запускаем новую
});

function stopPlayback() {
    isPlaying = false;
    playbackQueue = []; // Очищаем очередь, чтобы остановить текущую мелодию
}

function startPlayback() {
    isPlaying = true;
    playbackQueue.forEach((item, index) => {
        const { row, col } = item;
        const note = notes[row];

        setTimeout(() => {
            if (!isPlaying) return; // Проверяем, не остановлено ли воспроизведение
            playNote(note, durations[row][col]);
        }, index * playbackSpeed);
    });

    // Автоматически останавливаем воспроизведение после последней ноты
    setTimeout(() => {
        isPlaying = false;
    }, playbackQueue.length * playbackSpeed);
}

// Очистка сетки и очереди
clearButton.addEventListener("click", () => {
    stopPlayback(); // Останавливаем воспроизведение
    activeCells = Array(rows).fill(null).map(() => Array(cols).fill(false));
    durations = Array(rows).fill(null).map(() => Array(cols).fill(300));
    playbackQueue = [];
    document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("active"));
});

// Сохранение мелодии
saveButton.addEventListener("click", () => {
    savedMelody = playbackQueue.map(({ row, col }) => ({
        row,
        col,
        duration: durations[row][col]
    }));
    alert("Мелодия сохранена!");
});

// Загрузка мелодии
loadButton.addEventListener("click", () => {
    if (!savedMelody.length) {
        alert("Нет сохраненной мелодии!");
        return;
    }

    activeCells = Array(rows).fill(null).map(() => Array(cols).fill(false));
    durations = Array(rows).fill(null).map(() => Array(cols).fill(300));
    playbackQueue = [];

    savedMelody.forEach(({ row, col, duration }) => {
        activeCells[row][col] = true;
        durations[row][col] = duration;
        playbackQueue.push({ row, col });

        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add("active");
    });

    alert("Мелодия загружена!");
});

// Воспроизведение звука ноты
function playNote(note, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const frequency = noteToFrequency(note);
    oscillator.type = waveTypeSelect.value;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const baseGain = globalVolume;
    gainNode.gain.setValueAtTime(baseGain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Преобразование названия ноты в частоту
function noteToFrequency(note) {
    const A4 = 440;
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = parseInt(note.slice(-1));
    const keyNumber = notes.indexOf(note.slice(0, -1));

    return A4 * Math.pow(2, (keyNumber + (octave - 4) * 12 - 9) / 12);
}

// Обновляем параметры
speedControl.addEventListener("input", (e) => {
    playbackSpeed = parseInt(e.target.value);
});

volumeControl.addEventListener("input", (e) => {
    globalVolume = parseFloat(e.target.value);
});

loopCheckbox.addEventListener("change", (e) => {
    isLooping = e.target.checked;
});

const vibrationFrequencyControl = document.getElementById("vibrationFrequency");
const vibrationDepthControl = document.getElementById("vibrationDepth");

let vibrationFrequency = parseFloat(vibrationFrequencyControl.value); // Частота вибрации
let vibrationDepth = parseFloat(vibrationDepthControl.value); // Амплитуда вибрации

vibrationFrequencyControl.addEventListener("input", (e) => {
    vibrationFrequency = parseFloat(e.target.value);
});

vibrationDepthControl.addEventListener("input", (e) => {
    vibrationDepth = parseFloat(e.target.value);
});

function playNote(note, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const lfo = audioContext.createOscillator(); // Создаем LFO
    const lfoGain = audioContext.createGain(); // Усиление LFO

    const frequency = noteToFrequency(note);
    oscillator.type = waveTypeSelect.value;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Настраиваем LFO
    lfo.frequency.setValueAtTime(vibrationFrequency, audioContext.currentTime); // Частота вибрации
    lfoGain.gain.setValueAtTime(vibrationDepth, audioContext.currentTime); // Амплитуда вибрации

    lfo.connect(lfoGain); // LFO управляет амплитудой
    lfoGain.connect(oscillator.frequency); // Подключаем LFO к частоте основного генератора

    // Настраиваем основное усиление
    const baseGain = globalVolume;
    gainNode.gain.setValueAtTime(baseGain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    // Подключаем генераторы и узлы
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Запускаем генераторы
    oscillator.start();
    lfo.start(); // Запускаем LFO
    oscillator.stop(audioContext.currentTime + duration / 1000);
    lfo.stop(audioContext.currentTime + duration / 1000);
}

function isVibrationSupported() {
    return "vibrate" in navigator;
}

function playNote(note, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const frequency = noteToFrequency(note);
    oscillator.type = waveTypeSelect.value;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const baseGain = globalVolume;
    gainNode.gain.setValueAtTime(baseGain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);

    // Включаем вибрацию через Web API Vibrations
    if (isVibrationSupported()) {
        navigator.vibrate(duration); // Вибрация длится столько же, сколько длится нота
    }
}
const enableVibrationCheckbox = document.getElementById("enableVibration");
let isVibrationEnabled = enableVibrationCheckbox.checked;

enableVibrationCheckbox.addEventListener("change", (e) => {
    isVibrationEnabled = e.target.checked;
});

function playNote(note, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const frequency = noteToFrequency(note);
    oscillator.type = waveTypeSelect.value;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const baseGain = globalVolume;
    gainNode.gain.setValueAtTime(baseGain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);

    // Включаем вибрацию, если она активна
    if (isVibrationEnabled && isVibrationSupported()) {
        navigator.vibrate(duration);
    }
}

const saveAudioButton = document.getElementById("saveAudio");

// Создаем аудиоконтекст и буфер записи
const offlineAudioContext = new OfflineAudioContext(1, 44100 * 10, 44100); // 10 секунд буфера
const masterGain = offlineAudioContext.createGain();
masterGain.connect(offlineAudioContext.destination);

// Функция для записи мелодии
async function saveMelodyAsAudio() {
    // Время начала записи
    let currentTime = 0;

    playbackQueue.forEach(({ row, col }) => {
        const note = notes[row];
        const duration = durations[row][col] / 1000; // Конвертируем в секунды
        const frequency = noteToFrequency(note);

        // Создаем осциллятор для каждой ноты
        const oscillator = offlineAudioContext.createOscillator();
        const gainNode = offlineAudioContext.createGain();

        oscillator.type = waveTypeSelect.value;
        oscillator.frequency.setValueAtTime(frequency, currentTime);
        gainNode.gain.setValueAtTime(globalVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

        // Подключаем узлы
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        // Запускаем осциллятор
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);

        // Обновляем время начала следующей ноты
        currentTime += duration + playbackSpeed / 1000; // Учитываем паузу между нотами
    });

    // Рендерим аудио
    const renderedBuffer = await offlineAudioContext.startRendering();

    // Конвертируем буфер в WAV
    const wavFile = createWAVFile(renderedBuffer);

    // Создаем Blob и сохраняем
    const blob = new Blob([wavFile], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    // Создаем ссылку для скачивания
    const a = document.createElement("a");
    a.href = url;
    a.download = "melody.wav";
    a.click();

    // Освобождаем память
    URL.revokeObjectURL(url);
}

// Конвертируем буфер в WAV
function createWAVFile(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numberOfChannels;
    const data = new Float32Array(length);
    const interleaved = new Int16Array(length);

    // Смешиваем каналы
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        data.set(buffer.getChannelData(i), i * buffer.length);
    }

    // Конвертируем в 16-битный PCM
    for (let i = 0; i < length; i++) {
        interleaved[i] = Math.max(-1, Math.min(1, data[i])) * 0x7FFF;
    }

    // Создаем заголовок WAV
    const wavHeader = new Uint8Array(44);
    const view = new DataView(wavHeader.buffer);

    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + interleaved.length * 2, true); // File size - 8 bytes
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746D66, true); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numberOfChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
    view.setUint16(32, numberOfChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, interleaved.length * 2, true); // Data size

    // Объединяем заголовок и данные
    const wavFile = new Uint8Array(wavHeader.length + interleaved.length * 2);
    wavFile.set(wavHeader, 0);
    wavFile.set(new Uint8Array(interleaved.buffer), wavHeader.length);

    return wavFile;
}

// Обработчик нажатия на кнопку
saveAudioButton.addEventListener("click", saveMelodyAsAudio);
