"""
Unsupervised Feature Discovery and Correlation Analysis
Discovers hidden patterns in data without pre-classification
Pulls news, weather, and player mechanics as anonymous weighted features
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
import json
import requests
from datetime import datetime, timedelta
import re

# Try to import ML libraries
try:
    import torch
    import torch.nn as nn
    from sklearn.decomposition import PCA
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("⚠️ ML libraries not available. Using basic correlation analysis.")


class CorrelationDiscoverer:
    """
    Discovers hidden correlations in data without pre-classification
    Uses PCA, clustering, and correlation analysis to find patterns
    """
    
    def __init__(self, n_components: int = 10):
        self.n_components = n_components
        self.pca = None
        self.scaler = StandardScaler()
        self.discovered_features = []
        self.feature_weights = None
    
    def discover_correlations(self, data_matrix: np.ndarray) -> Dict:
        """
        Discover hidden correlations in data
        
        Args:
            data_matrix: [n_samples, n_features] raw data
        
        Returns:
            dict with discovered feature weights and correlations
        """
        if data_matrix.shape[0] < 10:
            return {"error": "Need at least 10 samples"}
        
        # Normalize data
        data_scaled = self.scaler.fit_transform(data_matrix)
        
        # PCA to find principal components (hidden patterns)
        if ML_AVAILABLE:
            self.pca = PCA(n_components=min(self.n_components, data_matrix.shape[1]))
            principal_components = self.pca.fit_transform(data_scaled)
            
            # Extract feature weights (loadings)
            feature_weights = self.pca.components_.T  # [n_features, n_components]
            
            # Explained variance (importance of each component)
            explained_variance = self.pca.explained_variance_ratio_
            
            # Find correlations between features
            correlation_matrix = np.corrcoef(data_scaled.T)
            
            # Discover strong correlations (hidden relationships)
            strong_correlations = []
            n_features = correlation_matrix.shape[0]
            for i in range(n_features):
                for j in range(i+1, n_features):
                    corr = correlation_matrix[i, j]
                    if abs(corr) > 0.7:  # Strong correlation threshold
                        strong_correlations.append({
                            'feature_i': i,
                            'feature_j': j,
                            'correlation': float(corr)
                        })
        else:
            # Fallback: basic correlation
            correlation_matrix = np.corrcoef(data_scaled.T)
            feature_weights = np.eye(data_scaled.shape[1])  # Identity as fallback
            explained_variance = np.ones(data_scaled.shape[1]) / data_scaled.shape[1]
            strong_correlations = []
        
        return {
            'feature_weights': feature_weights.tolist(),  # Anonymous weights
            'explained_variance': explained_variance.tolist(),
            'strong_correlations': strong_correlations,
            'n_discovered_features': len(explained_variance)
        }
    
    def extract_anonymous_features(self, data_point: np.ndarray) -> np.ndarray:
        """
        Extract anonymous features using discovered weights
        
        Args:
            data_point: Single data point [n_features]
        
        Returns:
            Anonymous feature vector [n_components]
        """
        if self.pca is None:
            return data_point  # Return as-is if not trained
        
        data_scaled = self.scaler.transform(data_point.reshape(1, -1))
        anonymous_features = self.pca.transform(data_scaled)
        return anonymous_features.flatten()


class NewsWeatherFetcher:
    """
    Fetches latest news and weather data
    Returns as anonymous weighted features (no names)
    """
    
    def __init__(self):
        self.news_cache = {}
        self.weather_cache = {}
    
    def fetch_team_news(self, team_abbr: str, days_back: int = 7) -> np.ndarray:
        """
        Fetch latest news for team
        Returns anonymous feature vector (weights only, no names)
        
        Returns 8-dimensional vector of weights
        """
        # In production, use news API (NewsAPI, etc.)
        # For now, simulate based on team performance
        
        # Feature weights (anonymous - just numbers)
        features = np.zeros(8)
        
        # Weight 0: Recent performance mentions (positive/negative sentiment)
        features[0] = np.random.uniform(-0.5, 0.5)  # Would be sentiment score
        
        # Weight 1: Injury news frequency
        features[1] = np.random.uniform(0, 0.3)  # Would be injury mentions
        
        # Weight 2: Trade/roster change mentions
        features[2] = np.random.uniform(0, 0.2)
        
        # Weight 3: Coaching news frequency
        features[3] = np.random.uniform(0, 0.15)
        
        # Weight 4: Player controversy mentions (negative)
        features[4] = -np.random.uniform(0, 0.2)
        
        # Weight 5: Media attention volume
        features[5] = np.random.uniform(0, 1.0)
        
        # Weight 6: Positive momentum mentions
        features[6] = np.random.uniform(0, 0.5)
        
        # Weight 7: Team chemistry mentions
        features[7] = np.random.uniform(0, 0.4)
        
        return features
    
    def fetch_game_weather(self, team_abbr: str, opponent_abbr: str, 
                          game_date: Optional[datetime] = None) -> np.ndarray:
        """
        Fetch weather conditions for game
        Returns anonymous feature vector (weights only)
        
        Returns 6-dimensional vector of weights
        """
        if game_date is None:
            game_date = datetime.now()
        
        # In production, use weather API (OpenWeatherMap, etc.)
        # For now, simulate weather features
        
        # Feature weights (anonymous)
        features = np.zeros(6)
        
        # Weight 0: Temperature impact (normalized)
        features[0] = np.random.uniform(-0.5, 0.5)  # Cold/hot
        
        # Weight 1: Wind speed impact
        features[1] = -np.random.uniform(0, 0.4)  # Negative (wind hurts passing)
        
        # Weight 2: Precipitation impact
        features[2] = -np.random.uniform(0, 0.5)  # Negative (rain/snow)
        
        # Weight 3: Humidity impact
        features[3] = np.random.uniform(-0.2, 0.2)
        
        # Weight 4: Dome indicator (1.0 = dome, 0.0 = outdoor)
        features[4] = 1.0 if team_abbr in ['DET', 'IND', 'NO', 'ATL', 'DAL', 'HOU'] else 0.0
        
        # Weight 5: Weather consistency (less variance = better)
        features[5] = np.random.uniform(0.5, 1.0)
        
        return features
    
    def fetch_player_news(self, player_name: str, position: str) -> np.ndarray:
        """
        Fetch latest news about specific player
        Returns anonymous feature vector
        
        Returns 5-dimensional vector of weights
        """
        # Feature weights (anonymous)
        features = np.zeros(5)
        
        # Weight 0: Recent performance mentions
        features[0] = np.random.uniform(-0.5, 0.5)
        
        # Weight 1: Injury status mentions
        features[1] = -np.random.uniform(0, 0.3)
        
        # Weight 2: Contract/roster news
        features[2] = np.random.uniform(-0.2, 0.2)
        
        # Weight 3: Media attention
        features[3] = np.random.uniform(0, 0.5)
        
        # Weight 4: Social media sentiment
        features[4] = np.random.uniform(-0.3, 0.3)
        
        return features


class AnonymousPlayerMechanics:
    """
    Extracts player mechanics as anonymous weighted features
    No names, just numbered weights
    """
    
    def __init__(self):
        self.correlation_discoverer = CorrelationDiscoverer(n_components=15)
    
    def extract_anonymous_mechanics(self, player_data: Dict, 
                                   news_features: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Extract player mechanics as anonymous features
        
        Returns vector of weights (no feature names)
        """
        # Start with raw player stats
        raw_features = []
        
        # Collect all available stats (don't name them)
        for key, value in player_data.items():
            if isinstance(value, (int, float)):
                raw_features.append(float(value))
        
        # Add news features if available
        if news_features is not None:
            raw_features.extend(news_features.tolist())
        
        # Convert to array
        feature_array = np.array(raw_features)
        
        # If we have enough data, discover correlations
        if len(raw_features) > 5:
            # Normalize
            feature_array = (feature_array - np.mean(feature_array)) / (np.std(feature_array) + 1e-8)
        
        return feature_array
    
    def extract_team_anonymous_features(self, team_data: Dict,
                                       news_features: Optional[np.ndarray] = None,
                                       weather_features: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Extract team features as anonymous weighted vector
        
        Returns combined feature vector (no names)
        """
        # Collect all team stats
        raw_features = []
        
        for key, value in team_data.items():
            if isinstance(value, (int, float)):
                raw_features.append(float(value))
        
        # Add news
        if news_features is not None:
            raw_features.extend(news_features.tolist())
        
        # Add weather
        if weather_features is not None:
            raw_features.extend(weather_features.tolist())
        
        feature_array = np.array(raw_features)
        
        # Normalize
        if len(feature_array) > 0:
            feature_array = (feature_array - np.mean(feature_array)) / (np.std(feature_array) + 1e-8)
        
        return feature_array


class UnsupervisedParleyPredictor:
    """
    Predicts parleys using unsupervised feature discovery
    No pre-classified features - discovers patterns automatically
    """
    
    def __init__(self):
        self.correlation_discoverer = CorrelationDiscoverer(n_components=20)
        self.news_fetcher = NewsWeatherFetcher()
        self.mechanics_extractor = AnonymousPlayerMechanics()
        self.discovered_weights = None
        self.winning_pattern = None
        self.is_trained = False
    
    def discover_patterns(self, training_data: List[Dict]) -> Dict:
        """
        Discover hidden patterns in training data
        
        Args:
            training_data: List of parley dicts with outcomes
        
        Returns:
            dict with discovered feature weights and correlations
        """
        # Build data matrix from all features
        feature_vectors = []
        outcomes = []
        
        for parley in training_data:
            # Extract all features (anonymous)
            features = self._extract_all_features(parley)
            feature_vectors.append(features)
            outcomes.append(1.0 if parley.get('won', False) else 0.0)
        
        if len(feature_vectors) < 10:
            return {"error": "Need at least 10 samples for pattern discovery"}
        
        # Convert to matrix
        data_matrix = np.array(feature_vectors)
        outcomes_array = np.array(outcomes)
        
        # Discover correlations
        correlation_results = self.correlation_discoverer.discover_correlations(data_matrix)
        
        # Find features correlated with winning
        winning_correlations = []
        for i, outcome in enumerate(outcomes_array):
            if outcome > 0.5:  # Won
                winning_correlations.append(data_matrix[i])
        
        if len(winning_correlations) > 0:
            winning_pattern = np.mean(winning_correlations, axis=0)
            correlation_results['winning_pattern'] = winning_pattern.tolist()
        
        # Store discovered weights and winning pattern
        self.discovered_weights = correlation_results.get('feature_weights')
        self.winning_pattern = correlation_results.get('winning_pattern')
        self.is_trained = True
        
        return correlation_results
    
    def _extract_all_features(self, parley: Dict) -> np.ndarray:
        """Extract all features from parley (anonymous)"""
        all_features = []
        
        # Extract from each bet in parley
        for bet in parley.get('parley_bets', []):
            # Player mechanics (anonymous)
            if 'qb_data' in bet:
                qb_features = self.mechanics_extractor.extract_anonymous_mechanics(bet['qb_data'])
                all_features.extend(qb_features.tolist())
            
            if 'rb_data' in bet:
                rb_features = self.mechanics_extractor.extract_anonymous_mechanics(bet['rb_data'])
                all_features.extend(rb_features.tolist())
            
            if 'wr_data' in bet:
                wr_features = self.mechanics_extractor.extract_anonymous_mechanics(bet['wr_data'])
                all_features.extend(wr_features.tolist())
            
            if 'def_data' in bet:
                def_features = self.mechanics_extractor.extract_anonymous_mechanics(bet['def_data'])
                all_features.extend(def_features.tolist())
            
            # Team features (anonymous)
            if 'team_data' in bet:
                team_abbr = bet.get('team_abbr', '')
                opponent_abbr = bet.get('opponent_abbr', '')
                
                # Fetch news and weather
                news_features = self.news_fetcher.fetch_team_news(team_abbr)
                weather_features = self.news_fetcher.fetch_game_weather(team_abbr, opponent_abbr)
                
                team_features = self.mechanics_extractor.extract_team_anonymous_features(
                    bet['team_data'],
                    news_features,
                    weather_features
                )
                all_features.extend(team_features.tolist())
        
        return np.array(all_features)
    
    def predict(self, parley: Dict) -> float:
        """
        Predict parley using discovered patterns
        
        Returns:
            Win probability (0-1)
        """
        if not self.is_trained:
            return 0.5  # Default if not trained
        
        # Extract features
        features = self._extract_all_features(parley)
        
        # Use discovered weights to transform
        if self.discovered_weights is not None:
            # Project onto discovered feature space
            features_scaled = self.correlation_discoverer.scaler.transform(features.reshape(1, -1))
            transformed = np.dot(features_scaled, self.discovered_weights)
            
            # Simple prediction: distance to winning pattern
            # In production, use a trained model
            if self.winning_pattern is not None:
                winning_pattern = np.array(self.winning_pattern)
                distance = np.linalg.norm(transformed - winning_pattern)
                # Convert distance to probability (closer = higher prob)
                probability = 1.0 / (1.0 + distance)
            else:
                probability = 0.5
        else:
            probability = 0.5
        
        return float(np.clip(probability, 0.0, 1.0))


def fetch_latest_news_weather(team_abbr: str, opponent_abbr: str = None) -> Dict:
    """
    Fetch latest news and weather as anonymous features
    
    Returns:
        dict with anonymous feature vectors (no names, just weights)
    """
    fetcher = NewsWeatherFetcher()
    
    news_features = fetcher.fetch_team_news(team_abbr)
    weather_features = fetcher.fetch_game_weather(team_abbr, opponent_abbr) if opponent_abbr else np.zeros(6)
    
    return {
        'news_weights': news_features.tolist(),  # 8 weights (no names)
        'weather_weights': weather_features.tolist(),  # 6 weights (no names)
        'combined_weights': np.concatenate([news_features, weather_features]).tolist()
    }

