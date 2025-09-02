import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizResult {
  id: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export default function App() {
  // Quiz states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch questions from backend
  useEffect(() => {
    fetch("https://c16eaf7a8eb1.ngrok-free.app/Quize-jsp/Quections")
      .then((res) => res.json())
      .then((data: Question[]) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching:", err);
        setLoading(false);
      });
  }, []);

  // Load quiz history on app start
  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("quizHistory");
      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading quiz history:", error);
    }
  };

  const saveQuizResult = async (finalScore: number) => {
    try {
      const newResult: QuizResult = {
        id: Date.now().toString(),
        score: finalScore,
        totalQuestions: questions.length,
        date: new Date().toLocaleDateString(),
      };
      const updatedHistory = [...quizHistory, newResult];
      await AsyncStorage.setItem("quizHistory", JSON.stringify(updatedHistory));
      setQuizHistory(updatedHistory);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("quizHistory");
      setQuizHistory([]);
      Alert.alert("Success", "Quiz history cleared!");
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert("Please select an answer");
      return;
    }

    // check correctness
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    // next or finish
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      const finalScore =
        selectedAnswer === questions[currentQuestionIndex].correctAnswer
          ? score + 1
          : score;
      setScore(finalScore);
      setShowResult(true);
      saveQuizResult(finalScore);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setShowHistory(false);
  };

  if (loading) {
    return (
      <View>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View>
        <Text>No questions available</Text>
      </View>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView>
        <Text>Quiz Complete!</Text>
        <Text>
          Score: {score}/{questions.length}
        </Text>
        <Text>{percentage}%</Text>
        <TouchableOpacity onPress={resetQuiz}>
          <Text>Take Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Text>View History</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showHistory) {
    return (
      <SafeAreaView>
        <Text>Quiz History</Text>
        {quizHistory.length > 0 ? (
          quizHistory.map((item) => (
            <View key={item.id}>
              <Text>
                {item.score}/{item.totalQuestions} on {item.date}
              </Text>
            </View>
          ))
        ) : (
          <Text>No history yet</Text>
        )}
        <TouchableOpacity onPress={clearHistory}>
          <Text>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHistory(false)}>
          <Text>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <SafeAreaView>
      <Text>
        Question {currentQuestionIndex + 1} of {questions.length}
      </Text>
      <Text>{currentQuestion.question}</Text>
      {currentQuestion.options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => handleAnswerSelect(i)}
          style={{
            backgroundColor: selectedAnswer === i ? "lightblue" : "white",
          }}
        >
          <Text>{opt}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={handleNextQuestion}
        disabled={selectedAnswer === null}
      >
        <Text>
          {currentQuestionIndex + 1 === questions.length
            ? "Finish Quiz"
            : "Next Question"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf2f278',
  },
  content: {
    flex: 1,
    padding: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 35,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: '#000000ff',
  },
  historyButton: {
    backgroundColor: '#b941bdff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressText: {
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    backgroundColor: '#e5e7eb',
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    backgroundColor: '#3b82f6',
    height: 8,
    borderRadius: 4,
  },
  scoreCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreLabel: {
    textAlign: 'center',
    color: '#374151',
  },
  scoreValue: {
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  questionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  unselectedOption: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  optionText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedText: {
    color: 'white',
    fontWeight: '800',

  },
  unselectedText: {
    color: '#1f2937',
  },
  nextButton: {
    padding: 16,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000000ff',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 2,
  },
  nextButtonEnabled: {
    backgroundColor: '#10b981',
  },
  nextButtonDisabled: {
    backgroundColor: '#8993a2ff',
  },
  primaryButton: {
    backgroundColor: '#326ecfff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 2,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 350,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3b82f6',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16,
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 32,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyDate: {
    color: '#4b5563',
  },
  historyPercentage: {
    color: '#4b5563',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#6b7280',
    fontSize: 20,
  },
  emptyHistorySubtext: {
    color: '#9ca3af',
  },
});