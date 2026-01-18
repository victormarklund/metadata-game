import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { APP_VIEWS, INIT_PLAYER_ANSWER } from "src/data/constants";
import { buildPublicUrl } from "src/utils/publicUrl";

export const AppContext = createContext(null);

export function AppContextProvider({ children }) {
  // --------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------

  const createEpochFromData = useCallback(
    ({ year, month, day }) => {
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);
      return new Date(y, m, d).getTime();
    },
    []
  );

  // --------------------------------------------------------------------
  // Init game data
  // --------------------------------------------------------------------

  const [gameData, setGameData] = useState(null);

  const loadGame = useCallback(async () => {
    try {
      const response = await fetch(buildPublicUrl("data/game/data.json"), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load game data.");
      const data = await response.json();

      const newGameData = {
        ...data,
        images: (data?.images ?? []).map((img, index) => ({
          id: typeof img.id === "number" ? img.id : index,
          ...img,
        })),
      };

      newGameData.images.forEach((image) => {
        if (!image.correct_answer) {
          image.correctAnswer = null;
          return;
        }

        const d = new Date(image.correct_answer);
        if (Number.isNaN(d.getTime())) {
          image.correctAnswer = null;
          return;
        }

        const raw = {
          year: d.getFullYear(),
          month: d.getMonth(), // 0-based
          day: d.getDate(), // 1-based
        };

        image.correctAnswer = {
          str: image.correct_answer,
          raw,
          epoch: createEpochFromData(raw),
        };
      });

      setGameData(newGameData);
    } catch (error) {
      console.error(error);
      setGameData(null);
    }
  }, [createEpochFromData]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // --------------------------------------------------------------------
  // App state
  // --------------------------------------------------------------------

  const [isFinished, setIsFinished] = useState(false);
  const [loadingImg, setLoadingImg] = useState(true);
  const [currentView, setCurrentView] = useState(APP_VIEWS.SessionLoginView);

  const [resultData, setResultData] = useState(null);
  const [totalScore, setTotalScore] = useState(null);

  // --------------------------------------------------------------------
  // Game logic
  // --------------------------------------------------------------------

  const [currentImage, setCurrentImage] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [userAnswerYear, setUserAnswerYear] = useState(INIT_PLAYER_ANSWER.year);
  const [userAnswerMonth, setUserAnswerMonth] = useState(INIT_PLAYER_ANSWER.month);
  const [userAnswerDay, setUserAnswerDay] = useState(INIT_PLAYER_ANSWER.day);

  const resetUserAnswer = useCallback(() => {
    setUserAnswerYear(INIT_PLAYER_ANSWER.year);
    setUserAnswerMonth(INIT_PLAYER_ANSWER.month);
    setUserAnswerDay(INIT_PLAYER_ANSWER.day);
  }, []);

  // --------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------

  const validatePassword = useCallback(
    (password) => {
      try {
        if (!gameData?.session_password) throw new Error("Session password unknown.");
        if (password !== gameData.session_password) throw new Error("Wrong password.");
        return true;
      } catch {
        return false;
      }
    },
    [gameData]
  );

  const startGame = useCallback(
    (password) => {
      try {
        if (!validatePassword(password)) throw new Error("Wrong password.");
        if (!gameData?.images?.length) throw new Error("No images loaded.");
        setCurrentImage(gameData.images[0]);
        setCurrentView(APP_VIEWS.GameplayView);
        resetUserAnswer();
        setIsFinished(false);
        setResultData(null);
        setTotalScore(null);
        setUserAnswers([]);
        return true;
      } catch {
        return false;
      }
    },
    [gameData, resetUserAnswer, validatePassword]
  );

  // --------------------------------------------------------------------
  // Scoring / results
  // --------------------------------------------------------------------

  const calculateScore = useCallback((correctDateEpoch, guessedDateEpoch) => {
    const b = 0.7;
    const spanInDays = 700;
    const maxScore = 1000;

    const diffInDays =
      Math.abs(correctDateEpoch - guessedDateEpoch) / (1000 * 60 * 60 * 24);

    const powerFunction = (x) => maxScore - maxScore * (x / spanInDays) ** b;

    let score = Math.floor(powerFunction(diffInDays));
    if (diffInDays > spanInDays || Number.isNaN(score)) score = 0;

    return score;
  }, []);

  // NOTE: This now accepts an optional answers array so we can calculate using the
  // freshly-updated answers (fixes the "one-behind"/missing-last-answer bug).
  const calculateResult = useCallback(
    (answers = userAnswers) => {
      if (!gameData?.images?.length) return;

      const resultArr = [];
      let total = 0;

      gameData.images.forEach((image, index) => {
        const ua = answers[index];
        if (!ua) return;

        const resultObj = { ...image, user_answer: ua };
        resultObj.score = calculateScore(image.correctAnswer.epoch, ua.epoch);

        resultArr.push(resultObj);
        total += resultObj.score;
      });

      setResultData(resultArr);
      setTotalScore(total);
    },
    [calculateScore, gameData, userAnswers]
  );

  // --------------------------------------------------------------------
  // Navigation / flow (fixed to avoid stale userAnswers)
  // --------------------------------------------------------------------

  const finishGame = useCallback(
    (answersSnapshot) => {
      setIsFinished(true);
      setCurrentView(APP_VIEWS.ResultView);
      // Calculate immediately from the snapshot to avoid async state timing issues.
      calculateResult(answersSnapshot);
    },
    [calculateResult]
  );

  const nextImage = useCallback(
    (answersSnapshot) => {
      if (!currentImage || !gameData?.images?.length) return;

      setLoadingImg(true);

      const nextImageId = currentImage.id + 1;

      if (nextImageId === gameData.images.length) {
        finishGame(answersSnapshot);
      } else {
        setCurrentImage(gameData.images[nextImageId]);
        resetUserAnswer();
      }
    },
    [currentImage, finishGame, gameData, resetUserAnswer]
  );

  const answer = useCallback(() => {
    if (!currentImage) return;

    // Functional update ensures we compute from the latest state.
    setUserAnswers((prev) => {
      const next = [...prev];

      next[currentImage.id] = {
        raw: {
          year: userAnswerYear,
          month: userAnswerMonth,
          day: userAnswerDay,
        },
        epoch: createEpochFromData({
          year: userAnswerYear,
          month: userAnswerMonth,
          day: userAnswerDay,
        }),
      };

      // Use the freshly-built array instead of relying on async state.
      nextImage(next);

      return next;
    });
  }, [
    createEpochFromData,
    currentImage,
    nextImage,
    userAnswerDay,
    userAnswerMonth,
    userAnswerYear,
  ]);

  // --------------------------------------------------------------------
  // Save score
  // --------------------------------------------------------------------

  const handleSaveScore = useCallback(() => {
    if (!localStorage.getItem("history")) {
      localStorage.setItem("history", JSON.stringify([]));
    }

    const history = JSON.parse(localStorage.getItem("history") || "[]");
    const next = Array.isArray(history) ? [...history] : [];

    const sessionObj = {
      sessionName: gameData?.screen_name ?? "LinG Galan 2024",
      totalScore,
      date: new Date() * 1,
    };

    next.push(sessionObj);

    next.sort((a, b) => b.date - a.date);
    if (next.length > 5) next.splice(5);

    localStorage.setItem("history", JSON.stringify(next));

    setCurrentView(APP_VIEWS.SessionLoginView);
  }, [gameData, totalScore]);

  // --------------------------------------------------------------------
  // Context value
  // --------------------------------------------------------------------

  const value = useMemo(
    () => ({
      gameData,

      loadingImg,
      setLoadingImg,
      currentView,
      setCurrentView,
      currentImage,
      setCurrentImage,
      isFinished,
      setIsFinished,

      resultData,
      setResultData,
      totalScore,
      setTotalScore,
      handleSaveScore,

      // Actions
      validatePassword,
      startGame,

      // Game logic
      userAnswers,
      userAnswerYear,
      setUserAnswerYear,
      userAnswerMonth,
      setUserAnswerMonth,
      userAnswerDay,
      setUserAnswerDay,

      answer,
      calculateResult,

    }),
    [
      answer,
      calculateResult,
      currentImage,
      currentView,
      gameData,
      handleSaveScore,
      isFinished,
      loadingImg,
      resultData,
      startGame,
      totalScore,
      userAnswerDay,
      userAnswerMonth,
      userAnswerYear,
      userAnswers,
      validatePassword,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
