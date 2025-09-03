import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load quiz history and questions when app starts
  useEffect(() => {
    loadQuizHistory();
    fetchQuestions();
  }, []);

  // Fetch questions from your Java servlet
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // CHANGE THIS URL to match your server
      const response = await fetch('https://454c6606ccab.ngrok-free.app/Quize-jsp/Quection');
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        // If server fails, use sample questions
        console.log('Server not available, using sample questions');
        // setSampleQuestions();
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // If network fails, use sample questions
      // setSampleQuestions();
    } finally {
      setLoading(false);
    }
  };

  // // Sample questions if server is not available
  // const setSampleQuestions = () => {
  //   const sampleQuestions: Question[] = [
  //     {
  //       id: 1,
  //       question: "What is the capital of France?",
  //       options: ["London", "Berlin", "Paris", "Madrid"],
  //       correctAnswer: 2,
  //     },
  //     {
  //       id: 2,
  //       question: "Which planet is known as the Red Planet?",
  //       options: ["Venus", "Mars", "Jupiter", "Saturn"],
  //       correctAnswer: 1,
  //     },
  //     {
  //       id: 3,
  //       question: "What is 2 + 2?",
  //       options: ["3", "4", "5", "6"],
  //       correctAnswer: 1,
  //     },
  //     {
  //       id: 4,
  //       question: "Who painted the Mona Lisa?",
  //       options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
  //       correctAnswer: 2,
  //     },
  //     {
  //       id: 5,
  //       question: "What is the largest ocean on Earth?",
  //       options: ["Atlantic", "Indian", "Arctic", "Pacific"],
  //       correctAnswer: 3,
  //     },
  //   ];
  //   setQuestions(sampleQuestions);
  // };

  const loadQuizHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('quizHistory');
      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading quiz history:', error);
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
      await AsyncStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
      setQuizHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('quizHistory');
      setQuizHistory([]);
      Alert.alert('Success', 'Quiz history cleared!');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert('Please select an answer', 'You must choose an option before proceeding.');
      return;
    }

    // Check if answer is correct
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    // Move to next question or show results
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed
      const finalScore = selectedAnswer === questions[currentQuestionIndex].correctAnswer ? score + 1 : score;
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

  const renderOption = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.option,
        selectedAnswer === index ? styles.selectedOption : styles.unselectedOption
      ]}
      onPress={() => handleAnswerSelect(index)}
    >
      <Text
        style={[
          styles.optionText,
          selectedAnswer === index ? styles.selectedText : styles.unselectedText
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: QuizResult }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyScore}>
        Score: {item.score}/{item.totalQuestions}
      </Text>
      <Text style={styles.historyDate}>Date: {item.date}</Text>
      <Text style={styles.historyPercentage}>
        Percentage: {Math.round((item.score / item.totalQuestions) * 100)}%
      </Text>
    </View>
  );

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // History screen
  if (showHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <View style={styles.historyHeader}>
            <Text style={styles.title}>Quiz History</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {quizHistory.length > 0 ? (
            <FlatList
              data={quizHistory.slice().reverse()}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No quiz history yet!</Text>
              <Text style={styles.emptyHistorySubtext}>Take a quiz to see your results here.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowHistory(false)}>
            <Text style={styles.primaryButtonText}>Back to Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Result screen
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const getMessage = () => {
      if (percentage >= 80) return "Excellent! 🎉";
      if (percentage >= 60) return "Good job! 👍";
      if (percentage >= 40) return "Not bad! 🙂";
      return "Keep practicing! 💪";
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>{score}/{questions.length}</Text>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.messageText}>{getMessage()}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={resetQuiz}>
              <Text style={styles.primaryButtonText}>Take Quiz Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowHistory(true)}>
              <Text style={styles.primaryButtonText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Quiz screen
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No questions available!</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={fetchQuestions}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quiz App</Text>
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <Text style={styles.buttonText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>
            Current Score: <Text style={styles.scoreValue}>{score}</Text>
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options List */}
        <FlatList
          data={currentQuestion.options}
          renderItem={renderOption}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.optionsList}
        />

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedAnswer !== null ? styles.nextButtonEnabled : styles.nextButtonDisabled
          ]}
          onPress={handleNextQuestion}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.primaryButtonText}>
            {currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  historyButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    fontWeight: '500',
  },
  selectedText: {
    color: 'white',
  },
  unselectedText: {
    color: '#1f2937',
  },
  nextButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  nextButtonEnabled: {
    backgroundColor: '#10b981',
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 18,
  },
  emptyHistorySubtext: {
    color: '#9ca3af',
  },
});