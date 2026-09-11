(() => {
  const startScreen = document.getElementById("cifl-start");
  const flowScreen = document.getElementById("cifl-flow");
  const resultScreen = document.getElementById("cifl-result");
  const itemInput = document.getElementById("cifl-item");
  const startBtn = document.getElementById("cifl-start-btn");
  const backBtn = document.getElementById("cifl-back");
  const restartBtn = document.getElementById("cifl-restart");
  const progressEl = document.getElementById("cifl-progress");
  const questionEl = document.getElementById("cifl-question");
  const optionsEl = document.getElementById("cifl-options");
  const resultTitle = document.getElementById("cifl-result-title");
  const resultBody = document.getElementById("cifl-result-body");
  const resultReasons = document.getElementById("cifl-result-reasons");
  const resultItem = document.getElementById("cifl-result-item");

  if (!startBtn || !startScreen || !flowScreen || !resultScreen) return;

  const questions = [
    {
      key: "need",
      text: "Bu satın alma gerçek bir ihtiyacı mı karşılıyor, yoksa bir isteği mi?",
      options: [
        { label: "Net bir ihtiyacı karşılıyor", score: 2 },
        { label: "Kısmen ihtiyaç, kısmen istek", score: 1 },
        { label: "Asıl olarak bir istek", score: 0 },
      ],
    },
    {
      key: "existing",
      text: "Elinde aynı işi gören bir şey zaten var mı?",
      options: [
        { label: "Hayır, gerçek bir boşluk var", score: 2 },
        { label: "Benzer bir şey var ama yetersiz", score: 1 },
        { label: "Evet, zaten benzeri var", score: 0 },
      ],
    },
    {
      key: "frequency",
      text: "Bunu ne sıklıkla kullanacağını düşünüyorsun?",
      options: [
        { label: "Haftada birkaç kez veya daha fazla", score: 2 },
        { label: "Ayda birkaç kez", score: 1 },
        { label: "Nadiren / özel durumlar", score: 0 },
      ],
    },
    {
      key: "longevity",
      text: "Bu parça yıllarca yaşlanıp seninle kalabilir mi?",
      options: [
        { label: "Evet — kaliteli ve uzun ömürlü", score: 2 },
        { label: "Belki — orta seviye dayanıklılık", score: 1 },
        { label: "Hayır — kısa ömürlü / trend", score: 0 },
      ],
    },
    {
      key: "cost",
      text: "Bu harcama seni mali olarak zorlar mı?",
      options: [
        { label: "Hayır, bütçemi bozmaz", score: 2 },
        { label: "Biraz düşünmem gerekir", score: 1 },
        { label: "Evet, baskı yaratır", score: 0 },
      ],
    },
    {
      key: "motive",
      text: "Satın alma dürtüsünün asıl kaynağı ne?",
      options: [
        { label: "İşlev ve uzun vadeli değer", score: 2 },
        { label: "Karışık — hem işlev hem duygu", score: 1 },
        { label: "Sıkılma, kıyaslama veya anlık heves", score: 0 },
      ],
    },
  ];

  const reasonCopy = {
    need: {
      0: "Asıl motivasyon ihtiyaç değil, istek gibi görünüyor.",
      1: "İhtiyaç ile istek birbirine karışmış durumda.",
      2: "Gerçek bir ihtiyaca işaret ediyor.",
    },
    existing: {
      0: "Elimdeki alternatif bu ihtiyacı zaten karşılıyor olabilir.",
      1: "Mevcut seçenekler kısmen yeterli.",
      2: "Gerçek bir boşluk var.",
    },
    frequency: {
      0: "Kullanım sıklığı düşük görünüyor.",
      1: "Orta düzey bir kullanım bekleniyor.",
      2: "Düzenli kullanım ihtimali yüksek.",
    },
    longevity: {
      0: "Uzun ömür vaadi zayıf.",
      1: "Dayanıklılık konusunda orta bir güven var.",
      2: "Yaşlanabilecek, kalıcı bir parça gibi duruyor.",
    },
    cost: {
      0: "Mali yük belirgin.",
      1: "Bütçe etkisi dikkat istiyor.",
      2: "Finansal olarak sürdürülebilir görünüyor.",
    },
    motive: {
      0: "Dürtü, heves veya kıyaslama ağır basıyor.",
      1: "Motivasyon karmaşık.",
      2: "Karar işlev ve değere dayanıyor.",
    },
  };

  let itemName = "";
  let step = 0;
  const answers = [];

  function show(screen) {
    [startScreen, flowScreen, resultScreen].forEach((node) => {
      node.hidden = node !== screen;
    });
  }

  function renderStep() {
    const q = questions[step];
    progressEl.innerHTML = `<strong>${String(step + 1).padStart(2, "0")}</strong> / ${String(questions.length).padStart(2, "0")}`;
    questionEl.textContent = q.text;
    optionsEl.innerHTML = "";

    q.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cifl-option";
      btn.textContent = option.label;
      btn.addEventListener("click", () => {
        answers[step] = {
          key: q.key,
          score: option.score,
          label: option.label,
        };
        if (step < questions.length - 1) {
          step += 1;
          renderStep();
        } else {
          showResult();
        }
      });
      optionsEl.appendChild(btn);
    });

    backBtn.hidden = false;
  }

  function showResult() {
    const total = answers.reduce((sum, a) => sum + a.score, 0);
    const max = questions.length * 2;
    const ratio = total / max;

    let title = "";
    let body = "";

    if (ratio < 0.45) {
      title = "Satın almak için güçlü bir neden görünmüyor.";
      body =
        "Cevapların, bu kararın şu an daha çok dürtü, yedekleme veya düşük kullanım üzerine kurulu olabileceğini gösteriyor. En sade seçenek çoğu zaman satın almamaktır.";
    } else if (ratio < 0.7) {
      title = "Karar henüz net değil. 72 saat bekle.";
      body =
        "Bazı işaretler olumlu, bazıları ise temkinli. İhtiyaç hâlâ aynıysa, eldeki alternatifleri ve uzun vadeli kullanımı bir kez daha tart. Aceleye gerek yok.";
    } else {
      title = "Bu satın alma mantıklı görünüyor.";
      body =
        "Cevapların ihtiyaç, kullanım ve uzun ömür tarafında daha güçlü. Yine de 72 saat bekle. İhtiyaç hâlâ aynıysa, bilinçli şekilde ilerleyebilirsin.";
    }

    resultItem.textContent = itemName ? `Konu: ${itemName}` : "";
    resultTitle.textContent = title;
    resultBody.textContent = body;
    resultReasons.innerHTML = "";

    const weak = answers.filter((a) => a.score <= 1).slice(0, 4);
    (weak.length ? weak : answers.slice(0, 2)).forEach((a) => {
      const li = document.createElement("li");
      li.textContent = reasonCopy[a.key][a.score];
      resultReasons.appendChild(li);
    });

    show(resultScreen);
  }

  startBtn.addEventListener("click", () => {
    itemName = (itemInput?.value || "").trim();
    step = 0;
    answers.length = 0;
    show(flowScreen);
    renderStep();
  });

  backBtn?.addEventListener("click", () => {
    if (step === 0) {
      show(startScreen);
      return;
    }
    step -= 1;
    renderStep();
  });

  restartBtn?.addEventListener("click", () => {
    step = 0;
    answers.length = 0;
    if (itemInput) itemInput.value = itemName;
    show(startScreen);
  });

  itemInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      startBtn.click();
    }
  });
})();
