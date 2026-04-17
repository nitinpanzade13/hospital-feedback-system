#!/usr/bin/env python3
"""
AI Worker - Sentiment Analysis Service
Continuously polls backend for unprocessed feedback and analyzes emotions.

Supports both transformer-based models (high accuracy) and lightweight
rule-based analysis (fallback for CPU-only systems).

Usage:
    python ai_worker.py
    
Environment variables:
    BACKEND_URL: Backend API URL (default: http://localhost:8000)
    POLLING_INTERVAL: Seconds between polls (default: 5)
    BATCH_SIZE: Feedback items per batch (default: 10)
    USE_DEMO_MODE: Use random results for testing (default: False)
"""

import asyncio
import aiohttp
import os
from datetime import datetime
import logging
from typing import Optional, List, Dict, Tuple
from dotenv import load_dotenv
import re

# Try to import transformer model, but don't fail if unavailable
try:
    import torch
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logger_msg = "⚠️  Transformers not available, using lightweight analysis"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
POLLING_INTERVAL = int(os.getenv("POLLING_INTERVAL", "5"))  # seconds
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10"))
USE_DEMO_MODE = os.getenv("USE_DEMO_MODE", "false").lower() == "true"

if HAS_TRANSFORMERS:
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"🤖 Using device: {DEVICE}")
else:
    logger.info("⚠️  Transformers not available, using lightweight analysis")


class SentimentAnalyzer:
    """
    Multilingual sentiment analysis with fallback support.
    Uses transformer models when available, falls back to lightweight rules.
    """

    def __init__(self):
        """Initialize the sentiment analysis pipeline."""
        self.use_transformers = False
        self.classifier = None
        
        # Emotion labels for classification
        self.emotion_labels = [
            "joy", "happiness", "satisfaction",
            "neutral",
            "dissatisfaction", "frustration",
            "anger", "sadness", "fear",
            "trust", "surprise", "anticipation"
        ]
        
        # Keyword mappings for lightweight analysis
        self.emotion_keywords = {
            "joy": ["great", "excellent", "wonderful", "amazing", "love", "perfect", "happy"],
            "happiness": ["good", "glad", "pleased", "nice", "wonderful"],
            "satisfaction": ["satisfied", "pleased", "okay", "fine", "good"],
            "neutral": ["ok", "average", "normal", "regular", "standard"],
            "dissatisfaction": ["poor", "bad", "unhappy", "disappointed", "worse"],
            "frustration": ["frustrating", "annoying", "difficult", "confusing"],
            "anger": ["angry", "furious", "outraged", "mad"],
            "sadness": ["sad", "depressed", "unhappy", "miserable"],
            "fear": ["scared", "afraid", "worried", "anxious"],
            "trust": ["trust", "reliable", "dependable", "confident"],
            "surprise": ["surprised", "unexpected", "shocked", "amazed"],
            "anticipation": ["looking forward", "excited", "expecting"]
        }
        
        if HAS_TRANSFORMERS and not USE_DEMO_MODE:
            try:
                logger.info("Loading transformer model...")
                self.classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if DEVICE == "cuda" else -1
                )
                self.use_transformers = True
                logger.info("✓ Transformer model loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load transformer: {e}")
                logger.info("Falling back to lightweight analysis")
        
        if not self.use_transformers:
            logger.info("✓ Using lightweight keyword-based analysis")

    def analyze(self, text: str, language: str = "en") -> Tuple[str, float]:
        """
        Analyze sentiment and emotion of the text.
        
        Args:
            text: Feedback text to analyze
            language: Language code (en, hi, es, fr, etc.)
            
        Returns:
            Tuple of (emotion, confidence_score 0-1)
        """
        try:
            if not text or len(text.strip()) == 0:
                return ("neutral", 0.5)

            text_lower = text.lower()
            
            # Use transformer if available
            if self.use_transformers:
                result = self.classifier(
                    text,
                    self.emotion_labels,
                    multi_class=False
                )
                emotion = result['labels'][0]
                confidence = float(result['scores'][0])
                logger.debug(f"Analyzed (transformer): '{text[:50]}...' → {emotion} ({confidence:.1%})")
                return (emotion, confidence)
            
            # Fallback: rule-based analysis
            emotion_scores = {}
            for emotion, keywords in self.emotion_keywords.items():
                score = sum(
                    1 for keyword in keywords 
                    if keyword in text_lower
                )
                emotion_scores[emotion] = score
            
            # Get emotion with highest score
            if max(emotion_scores.values()) == 0:
                emotion = "neutral"
                confidence = 0.5
            else:
                emotion = max(emotion_scores, key=emotion_scores.get)
                total_matches = sum(emotion_scores.values())
                confidence = emotion_scores[emotion] / (total_matches or 1)
            
            logger.debug(f"Analyzed (rules): '{text[:50]}...' → {emotion} ({confidence:.1%})")
            return (emotion, min(confidence, 0.95))  # Cap at 0.95 for rules-based
            
        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            return ("neutral", 0.0)

    def batch_analyze(self, feedbacks: List[Dict]) -> List[Dict]:
        """
        Analyze a batch of feedback items.
        Analyzes all_responses for comprehensive emotion analysis.
        
        Args:
            feedbacks: List of feedback dictionaries
            
        Returns:
            List of feedbacks with emotion and confidence added
        """
        results = []
        for feedback in feedbacks:
            # Analyze all responses for comprehensive emotion detection
            all_responses = feedback.get('all_responses', {})
            
            # Combine all text for analysis
            combined_text = " ".join([
                f"{k}: {v}" 
                for k, v in all_responses.items() 
                if k not in ['Patient Name', 'Header']  # Skip non-content fields
            ])
            
            # Also analyze individual responses for detailed breakdown
            individual_emotions = {}
            for question, answer in all_responses.items():
                if question not in ['Patient Name', 'Header'] and answer:
                    emotion, conf = self.analyze(
                        str(answer),
                        feedback.get('language', 'en')
                    )
                    individual_emotions[question] = {
                        'emotion': emotion,
                        'confidence': conf
                    }
            
            # Calculate overall emotion from most frequent emotion in individual responses
            if individual_emotions:
                emotion_counts = {}
                total_confidence = 0
                
                for question, analysis in individual_emotions.items():
                    emotion = analysis['emotion']
                    confidence = analysis['confidence']
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                    total_confidence += confidence
                
                # Get the most frequent emotion
                overall_emotion = max(emotion_counts, key=emotion_counts.get)
                overall_confidence = total_confidence / len(individual_emotions)
            else:
                # Fallback if no individual emotions
                overall_emotion = "neutral"
                overall_confidence = 0.5
            
            results.append({
                'id': feedback['_id'],
                'emotion': overall_emotion,
                'confidence': overall_confidence,
                'detailed_analysis': individual_emotions,  # Per-question analysis
                'combined_feedback': combined_text
            })
        return results


class AIWorker:
    """
    Main worker process that:
    1. Polls backend for pending feedback
    2. Analyzes with sentiment model
    3. Updates backend with results
    """

    def __init__(self):
        """Initialize the AI Worker."""
        self.analyzer = SentimentAnalyzer()
        self.session: Optional[aiohttp.ClientSession] = None
        self.processed_count = 0
        self.error_count = 0

    async def setup(self):
        """Set up HTTP session."""
        self.session = aiohttp.ClientSession()
        logger.info("✓ HTTP session initialized")

    async def teardown(self):
        """Clean up HTTP session."""
        if self.session:
            await self.session.close()

    async def get_pending_feedback(self) -> Optional[Dict]:
        """
        Poll backend for pending feedback.
        
        Returns:
            Dictionary with pending feedback or None
        """
        try:
            url = f"{BACKEND_URL}/api/feedback/pending?limit={BATCH_SIZE}"
            logger.debug(f"📡 Fetching from: {url}")
            
            if not self.session:
                logger.error("❌ Session not initialized!")
                return None
            
            async with self.session.get(
                url,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"✓ Fetched {data.get('count', 0)} pending feedbacks")
                    return data
                elif response.status == 404:
                    logger.info("✓ No pending feedback available")
                    return None
                else:
                    error_text = await response.text()
                    logger.warning(f"⚠️ Backend returned {response.status}: {error_text}")
                    return None
        except asyncio.TimeoutError:
            logger.error(f"❌ Timeout connecting to {BACKEND_URL}")
            self.error_count += 1
            return None
        except aiohttp.ClientConnectorError as e:
            logger.error(f"❌ Connection error to {BACKEND_URL}: {e}")
            self.error_count += 1
            return None
        except Exception as e:
            logger.error(f"❌ Failed to fetch pending feedback: {type(e).__name__}: {e}")
            self.error_count += 1
            return None

    async def update_feedback(
        self,
        feedback_id: str,
        emotion: str,
        confidence: float,
        detailed_analysis: Optional[Dict] = None
    ) -> bool:
        """
        Update feedback with analysis results.
        
        Args:
            feedback_id: ID of the feedback
            emotion: Detected emotion
            confidence: Confidence score (0-1)
            detailed_analysis: Per-question emotion analysis (optional)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = {
                "emotion": emotion,
                "confidence_score": confidence
            }
            if detailed_analysis:
                payload["detailed_analysis"] = detailed_analysis
            
            async with self.session.post(
                f"{BACKEND_URL}/api/feedback/{feedback_id}/process",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    self.processed_count += 1
                    logger.info(
                        f"✓ Updated {feedback_id}: {emotion} "
                        f"({confidence:.1%})"
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to update {feedback_id}: {response.status}"
                    )
                    return False
        except Exception as e:
            logger.error(f"Error updating feedback: {e}")
            self.error_count += 1
            return False

    async def process_batch(self):
        """
        Fetch pending feedback and process in batch.
        Analyzes all responses for each feedback item.
        """
        data = await self.get_pending_feedback()
        
        if not data:
            logger.debug("⏳ No response from backend, waiting for retry...")
            return
        
        count = data.get('count', 0)
        if count == 0:
            logger.debug("✓ No pending feedback at this moment")
            return

        logger.info(f"📊 Processing {count} feedback items...")
        
        # Analyze batch using sentiment model
        feedbacks = data.get('feedback', [])
        if not feedbacks:
            logger.warning("⚠️ Data received but no feedbacks in response")
            return
        
        results = self.analyzer.batch_analyze(feedbacks)
        
        # Update backend with results (including detailed analysis)
        success_count = 0
        for result in results:
            updated = await self.update_feedback(
                result['id'],
                result['emotion'],
                result['confidence'],
                result.get('detailed_analysis')  # Pass per-question analysis
            )
            if updated:
                success_count += 1
        
        logger.info(f"✅ Successfully processed {success_count}/{count} feedbacks")

    async def run(self):
        """Main worker loop."""
        logger.info("🚀 AI Worker started")
        logger.info(f"📍 Backend: {BACKEND_URL}")
        logger.info(f"⏱️  Polling interval: {POLLING_INTERVAL}s")
        logger.info(f"🎯 Batch size: {BATCH_SIZE}")
        
        try:
            await self.setup()
            logger.info("✓ HTTP session initialized")
            
            # Test connection to backend
            logger.info("🔗 Testing connection to backend...")
            test_result = await self.get_pending_feedback()
            if test_result is not None:
                logger.info("✅ Backend connection successful!")
            else:
                logger.warning("⚠️ Backend connection test returned no data")
            
            # Main polling loop
            iteration = 0
            while True:
                iteration += 1
                try:
                    await self.process_batch()
                except Exception as e:
                    logger.error(f"❌ Batch processing error (iteration {iteration}): {type(e).__name__}: {e}")
                    self.error_count += 1
                
                # Log stats every 10 iterations
                if iteration % 10 == 0:
                    logger.info(
                        f"📈 Stats - Iteration: {iteration}, "
                        f"Processed: {self.processed_count}, "
                        f"Errors: {self.error_count}"
                    )
                
                await asyncio.sleep(POLLING_INTERVAL)
                
        except KeyboardInterrupt:
            logger.info("⏹️  Worker stopped by user")
        except Exception as e:
            logger.error(f"❌ Worker fatal error: {type(e).__name__}: {e}")
        finally:
            await self.teardown()
            logger.info(
                f"✓ Worker shutdown. "
                f"Total processed: {self.processed_count}, "
                f"Errors: {self.error_count}"
            )


async def main():
    """Entry point."""
    worker = AIWorker()
    await worker.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        exit(1)
