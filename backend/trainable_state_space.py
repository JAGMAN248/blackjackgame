"""
Trainable State-Space Model with Attention
Provides custom neural network that learns from online data

Success Metrics:
- Casino: Clean money (washing progress)
- Sportsbook: Winning bets (win rate)
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
import json
import os
from datetime import datetime, timedelta

# Try to import PyTorch
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    print("⚠️ PyTorch not available. Training disabled.")


class CasinoDataset(Dataset):
    """Dataset for casino game training (clean money as success metric)"""
    
    def __init__(self, sessions: List[Dict]):
        """
        Args:
            sessions: List of session dicts with:
                - features: game type, bet size, bankroll, etc.
                - clean_money: final clean money (success metric)
                - washing_progress: final washing progress
        """
        self.sessions = sessions
    
    def __len__(self):
        return len(self.sessions)
    
    def __getitem__(self, idx):
        session = self.sessions[idx]
        features = torch.FloatTensor(session['features'])
        # Success metric: clean money normalized (0-1)
        clean_money = session.get('clean_money', 0)
        bankroll = session.get('starting_bankroll', 1000)
        success = min(1.0, max(0.0, clean_money / bankroll))  # Normalized
        return features, torch.FloatTensor([success])


class SportsbookDataset(Dataset):
    """Dataset for sportsbook training (winning bets as success metric)"""
    
    def __init__(self, bets: List[Dict]):
        """
        Args:
            bets: List of bet dicts with:
                - features: team data, odds, etc.
                - won: bool (did bet win)
        """
        self.bets = bets
    
    def __len__(self):
        return len(self.bets)
    
    def __getitem__(self, idx):
        bet = self.bets[idx]
        features = torch.FloatTensor(bet['features'])
        # Success metric: 1 if won, 0 if lost
        success = 1.0 if bet.get('won', False) else 0.0
        return features, torch.FloatTensor([success])


class TrainableStateSpaceModel(nn.Module):
    """
    Trainable State-Space Model with Attention
    
    Architecture:
    - Input features → Attention → Hidden State → Output
    - A, B, C matrices are learnable parameters
    - Attention mechanism dynamically weights features
    """
    
    def __init__(self, feature_dim: int = 12, state_dim: int = 8, use_attention: bool = True):
        super(TrainableStateSpaceModel, self).__init__()
        
        self.feature_dim = feature_dim
        self.state_dim = state_dim
        self.use_attention = use_attention
        
        # A matrix: State transition (how hidden states evolve)
        self.A = nn.Parameter(torch.randn(state_dim, state_dim) * 0.1)
        
        # B matrix: Input-to-state mapping (how features affect states)
        self.B = nn.Linear(feature_dim, state_dim)
        
        # C matrix: State-to-output mapping (how states predict outcomes)
        self.C = nn.Linear(state_dim, 1)
        
        # Attention mechanism
        if use_attention:
            self.attention = nn.MultiheadAttention(feature_dim, num_heads=2, batch_first=True)
            self.attention_norm = nn.LayerNorm(feature_dim)
        
        # Layer normalization
        self.layer_norm = nn.LayerNorm(state_dim)
        
        # Initialize weights
        self._initialize_weights()
    
    def _initialize_weights(self):
        """Initialize weights with Xavier uniform"""
        nn.init.xavier_uniform_(self.A)
        nn.init.xavier_uniform_(self.B.weight)
        nn.init.xavier_uniform_(self.C.weight)
        nn.init.zeros_(self.B.bias)
        nn.init.zeros_(self.C.bias)
    
    def forward(self, features: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through state-space model
        
        Args:
            features: [batch_size, feature_dim] input features
        
        Returns:
            [batch_size, 1] output predictions
        """
        batch_size = features.size(0)
        
        # Apply attention if enabled
        if self.use_attention:
            # Reshape for attention: [batch, 1, feature_dim]
            features_attn = features.unsqueeze(1)
            attn_output, _ = self.attention(features_attn, features_attn, features_attn)
            features_attn = self.attention_norm(attn_output.squeeze(1))
            # Combine original and attended features
            features = features + features_attn  # Residual connection
        
        # Map features to hidden state: x = B * u
        state = self.B(features)  # [batch, state_dim]
        
        # State transition: x_new = A * x_old + x
        # (simplified: we use current state as both old and new for single-step prediction)
        state = torch.matmul(state, self.A.T) + state  # Residual connection
        state = self.layer_norm(state)
        
        # Output: y = C * x
        output = self.C(state)
        
        # Apply sigmoid for probability output
        output = torch.sigmoid(output)
        
        return output
    
    def predict(self, features: np.ndarray) -> float:
        """Predict single sample"""
        self.eval()
        with torch.no_grad():
            features_tensor = torch.FloatTensor(features).unsqueeze(0)
            output = self.forward(features_tensor)
            return output.item()


class StateSpaceTrainer:
    """Trainer for state-space models with success metrics"""
    
    def __init__(self, model: TrainableStateSpaceModel, device: str = 'cpu'):
        self.model = model
        self.device = device
        self.model.to(device)
        self.optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
        self.criterion = nn.MSELoss()  # Mean Squared Error for regression
        self.training_history = []
    
    def train_casino(self, sessions: List[Dict], epochs: int = 10, batch_size: int = 32):
        """
        Train model on casino data (clean money as success metric)
        
        Args:
            sessions: List of session dicts
            epochs: Number of training epochs
            batch_size: Batch size for training
        """
        if not PYTORCH_AVAILABLE:
            print("⚠️ PyTorch not available. Cannot train.")
            return
        
        dataset = CasinoDataset(sessions)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        self.model.train()
        
        for epoch in range(epochs):
            total_loss = 0.0
            num_batches = 0
            
            for features, targets in dataloader:
                features = features.to(self.device)
                targets = targets.to(self.device)
                
                # Forward pass
                predictions = self.model(features)
                
                # Loss: MSE between predicted and actual clean money ratio
                loss = self.criterion(predictions, targets)
                
                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
                num_batches += 1
            
            avg_loss = total_loss / num_batches if num_batches > 0 else 0
            self.training_history.append({
                'epoch': epoch + 1,
                'loss': avg_loss,
                'metric': 'clean_money_ratio'
            })
            
            if (epoch + 1) % 5 == 0:
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_loss:.4f}")
        
        self.model.eval()
        print(f"✅ Training complete. Final loss: {avg_loss:.4f}")
    
    def train_sportsbook(self, bets: List[Dict], epochs: int = 10, batch_size: int = 32):
        """
        Train model on sportsbook data (winning bets as success metric)
        
        Args:
            bets: List of bet dicts
            epochs: Number of training epochs
            batch_size: Batch size for training
        """
        if not PYTORCH_AVAILABLE:
            print("⚠️ PyTorch not available. Cannot train.")
            return
        
        dataset = SportsbookDataset(bets)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        self.model.train()
        
        for epoch in range(epochs):
            total_loss = 0.0
            num_batches = 0
            correct = 0
            total = 0
            
            for features, targets in dataloader:
                features = features.to(self.device)
                targets = targets.to(self.device)
                
                # Forward pass
                predictions = self.model(features)
                
                # Loss: MSE between predicted win prob and actual win (0 or 1)
                loss = self.criterion(predictions, targets)
                
                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                # Calculate accuracy
                predicted_wins = (predictions > 0.5).float()
                correct += (predicted_wins == targets).sum().item()
                total += targets.size(0)
                
                total_loss += loss.item()
                num_batches += 1
            
            avg_loss = total_loss / num_batches if num_batches > 0 else 0
            accuracy = correct / total if total > 0 else 0
            
            self.training_history.append({
                'epoch': epoch + 1,
                'loss': avg_loss,
                'accuracy': accuracy,
                'metric': 'win_rate'
            })
            
            if (epoch + 1) % 5 == 0:
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_loss:.4f}, Accuracy: {accuracy:.2%}")
        
        self.model.eval()
        print(f"✅ Training complete. Final loss: {avg_loss:.4f}, Final accuracy: {accuracy:.2%}")
    
    def save_model(self, filepath: str):
        """Save trained model"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'training_history': self.training_history,
            'feature_dim': self.model.feature_dim,
            'state_dim': self.model.state_dim
        }, filepath)
        print(f"✅ Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.training_history = checkpoint.get('training_history', [])
        print(f"✅ Model loaded from {filepath}")


def fetch_historical_sportsbook_data(sport: str = 'nfl', limit: int = 1000) -> List[Dict]:
    """
    Fetch historical sportsbook data for training
    
    In production, this would fetch from:
    - The Odds API historical data
    - Sports databases
    - Your own bet history
    
    Returns:
        List of bet dicts with features and outcomes
    """
    # Placeholder: In production, fetch real data
    # For now, return empty list (user should provide their own data)
    print(f"⚠️ Historical data fetching not implemented. Provide your own training data.")
    return []


def prepare_casino_features(session: Dict) -> np.ndarray:
    """
    Prepare feature vector from casino session data
    
    Features:
    - Game type (encoded)
    - Bet size / bankroll ratio
    - Starting bankroll
    - Dirty money ratio
    - Session duration
    - Number of hands played
    """
    features = np.zeros(12)
    
    # Game type encoding (one-hot would be better, but simplified)
    game_type = session.get('game_type', 'blackjack')
    game_encoding = {
        'blackjack': 0.0,
        'craps': 0.25,
        'poker': 0.5,
        'slots': 0.75
    }
    features[0] = game_encoding.get(game_type, 0.0)
    
    # Bet size ratio
    bet_size = session.get('avg_bet_size', 25)
    bankroll = session.get('starting_bankroll', 1000)
    features[1] = bet_size / bankroll if bankroll > 0 else 0
    
    # Starting bankroll (normalized)
    features[2] = min(1.0, bankroll / 10000)  # Normalize to 0-1
    
    # Dirty money ratio
    dirty_money = session.get('dirty_money', 0)
    features[3] = dirty_money / bankroll if bankroll > 0 else 0
    
    # Session duration (normalized)
    duration = session.get('duration_minutes', 60)
    features[4] = min(1.0, duration / 480)  # Normalize to 0-1 (8 hours max)
    
    # Hands played (normalized)
    hands = session.get('hands_played', 100)
    features[5] = min(1.0, hands / 1000)  # Normalize to 0-1
    
    # Washing target ratio
    washing_target = session.get('washing_target', 0)
    features[6] = washing_target / bankroll if bankroll > 0 else 0
    
    # Fill remaining features with zeros (can be extended)
    # features[7-11] = 0
    
    return features


def prepare_sportsbook_features(bet: Dict) -> np.ndarray:
    """
    Prepare feature vector from sportsbook bet data
    
    Features:
    - Team EPA metrics
    - Opponent EPA metrics
    - Odds
    - Recent form
    - Momentum
    """
    features = np.zeros(12)
    
    # Team EPA
    team_data = bet.get('team_data', {})
    features[0] = team_data.get('epa_offense', 0.0)
    features[1] = team_data.get('epa_defense', 0.0)
    features[2] = team_data.get('epa_rank', 15.0) / 32.0  # Normalized
    
    # Opponent EPA
    opp_data = bet.get('opponent_data', {})
    features[3] = opp_data.get('epa_offense', 0.0)
    features[4] = opp_data.get('epa_defense', 0.0)
    
    # Odds (normalized)
    odds = bet.get('odds', 2.0)
    features[5] = 1.0 / odds  # Implied probability
    
    # Recent form
    features[6] = team_data.get('recent_win_rate', 0.5)
    features[7] = opp_data.get('recent_win_rate', 0.5)
    
    # Momentum
    features[8] = team_data.get('momentum', 0.0)
    features[9] = opp_data.get('momentum', 0.0)
    
    # Home/away
    features[10] = 1.0 if bet.get('home', False) else 0.0
    
    # Rest advantage
    features[11] = bet.get('rest_advantage', 0.0) / 7.0  # Normalized
    
    return features

