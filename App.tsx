import React, { useState, useEffect } from 'react';
import {View,Text,TouchableOpacity,FlatList,Alert,SafeAreaView,StatusBar,StyleSheet,ActivityIndicator,} from 'react-native';
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


  useEffect(() => {
    loadQuizHistory();
    fetchQuestions();
  }, []);


  const setSampleQuestions = ()=> {
    const sampleQuestions: Question[] = [
      {
        id: 1,
        question: "What is 1 + 1 ?",
        options: ["1", "11", "2", "10"],
        correctAnswer: 2,
      },
      {
        id: 2,
        question: "What is 4 * 11?",
        options: ["4", "11", "444", "44"],
        correctAnswer: 3,
      },
      {
        id: 3,
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: "What is 2 * 2?",
        options: ["2", "4", "22", "6"],
        correctAnswer: 1,
      },
      {
        id: 5,
        question: "What is 2 * 10?",
        options: ["20", "2", "0.2", "200"],
        correctAnswer: 0,
      },
    ];
    setQuestions(sampleQuestions);
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('https://95833af0d60a.ngrok-free.app/Quize-jsp/Quection');
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        
        console.log(' "500" Server error occurred !!');
        setSampleQuestions();
      }
    } catch (error) {
      console.error('Error fetching questions:', error);

    } finally {
      setLoading(false);
    }
  };


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
      await AsyncStorage.removeItem('quizHistory');
      setQuizHistory([]);
      Alert.alert('Success', 'Quiz history cleared!');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert('Please select an answer', 'You must choose an option before proceeding.');
      return;
    }

    
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      
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
              <Text style={styles.emptyHistoryText}>No history available!</Text>
              <Text style={styles.emptyHistorySubtext}>Go to Quiz</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowHistory(false)}>
            <Text style={styles.primaryButtonText}>Back to Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const getMessage = () => {
      if (percentage >= 85) return "Excellent!";
      if (percentage >= 55) return "Good job!";
      if (percentage >= 35) return "Not bad!";
      return "Keep practicing!";
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee3e3ff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: '#2b26c9ff',
  },
  errorText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#ef4444',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  historyButton: {
    backgroundColor: '#313f5ab5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    

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
    backgroundColor: '#63ce48ff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    fontWeight: 'bold',
  },
  scoreLabel: {
    textAlign: 'center',
    color: '#374151',
  },
  scoreValue: {
    fontWeight: 'bold',
    color: '#f63b3bff',
    fontSize: 16,
  },
  questionCard: {
    backgroundColor: '#87d1e1ff',
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
    backgroundColor: '#2b34d4ff',
    borderColor: '#000000ff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Arial',
    color: '#ffffff', 

  },
  unselectedOption: {
    backgroundColor: '#f3f4f6',
    borderColor: '#988b8bff',
  },
  optionText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#1f2937',
  },
  nextButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    fontWeight: 'bold',
    fontSize: 18,
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
    color: '#5a606aff',
  },
  historyPercentage: {
    color: '#575d66ff',
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