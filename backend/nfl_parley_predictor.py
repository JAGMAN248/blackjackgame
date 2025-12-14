"""
NFL Parley Predictor with Multi-Layer State-Space Model
Learns from real NFL data and discovers hidden mechanics for winning parleys

Features:
- Player-level mechanics (QB, RB, WR, Defense)
- Multi-layer state-space model
- Parley combination optimization
- Hidden pattern discovery
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
import json
from datetime import datetime

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
    print("⚠️ PyTorch not available. NFL parley predictor disabled.")

# Try to import NFL data library (nflverse via nflreadpy)
try:
    import nflreadpy as nfl
    NFL_DATA_AVAILABLE = True
except ImportError:
    NFL_DATA_AVAILABLE = False
    print("⚠️ nflreadpy not available. Install: pip install nflreadpy")


class PlayerMechanicsExtractor:
    """
    Extracts player-level mechanics from NFL data
    Discovers hidden patterns that contribute to winning parleys
    """
    
    def __init__(self):
        self.player_stats_cache = {}
    
    def extract_qb_mechanics(self, qb_data: Dict) -> np.ndarray:
        """
        Extract QB mechanics (hidden factors for parley success)
        
        Returns 8-dimensional vector:
        - EPA per dropback
        - Completion rate under pressure
        - Deep ball accuracy
        - Red zone efficiency
        - 4th quarter performance
        - Home vs away split
        - Weather performance
        - Clutch factor (game-winning drives)
        """
        mechanics = np.zeros(8)
        
        # EPA per dropback (overall efficiency)
        mechanics[0] = qb_data.get('epa_per_dropback', 0.0)
        
        # Completion rate under pressure (resilience)
        mechanics[1] = qb_data.get('completion_rate_under_pressure', 0.6)
        
        # Deep ball accuracy (big play ability)
        mechanics[2] = qb_data.get('deep_ball_accuracy', 0.4)
        
        # Red zone efficiency (scoring ability)
        mechanics[3] = qb_data.get('red_zone_td_rate', 0.5)
        
        # 4th quarter performance (clutch)
        mechanics[4] = qb_data.get('q4_epa', 0.0)
        
        # Home vs away split (consistency)
        home_epa = qb_data.get('home_epa', 0.0)
        away_epa = qb_data.get('away_epa', 0.0)
        mechanics[5] = home_epa - away_epa  # Positive = better at home
        
        # Weather performance (reliability)
        mechanics[6] = qb_data.get('weather_epa', 0.0)
        
        # Clutch factor (game-winning drives)
        mechanics[7] = qb_data.get('game_winning_drives', 0) / max(qb_data.get('games_played', 1), 1)
        
        return mechanics
    
    def extract_rb_mechanics(self, rb_data: Dict) -> np.ndarray:
        """
        Extract RB mechanics
        
        Returns 6-dimensional vector:
        - Yards per carry
        - Breakaway run rate
        - Goal line efficiency
        - Pass catching ability
        - Fumble rate (negative)
        - Usage rate
        """
        mechanics = np.zeros(6)
        
        mechanics[0] = rb_data.get('yards_per_carry', 4.0) / 6.0  # Normalized
        mechanics[1] = rb_data.get('breakaway_run_rate', 0.1)  # 20+ yard runs
        mechanics[2] = rb_data.get('goal_line_td_rate', 0.5)
        mechanics[3] = rb_data.get('reception_rate', 0.7)
        mechanics[4] = -rb_data.get('fumble_rate', 0.02)  # Negative (bad)
        mechanics[5] = rb_data.get('usage_rate', 0.5)  # Touches per game
        
        return mechanics
    
    def extract_wr_mechanics(self, wr_data: Dict) -> np.ndarray:
        """
        Extract WR mechanics
        
        Returns 7-dimensional vector:
        - Target share
        - Catch rate
        - Yards after catch
        - Deep threat ability
        - Red zone target rate
        - Drop rate (negative)
        - Separation ability
        """
        mechanics = np.zeros(7)
        
        mechanics[0] = wr_data.get('target_share', 0.2)
        mechanics[1] = wr_data.get('catch_rate', 0.65)
        mechanics[2] = wr_data.get('yac_per_reception', 5.0) / 10.0  # Normalized
        mechanics[3] = wr_data.get('deep_target_rate', 0.2)
        mechanics[4] = wr_data.get('red_zone_target_rate', 0.15)
        mechanics[5] = -wr_data.get('drop_rate', 0.05)  # Negative (bad)
        mechanics[6] = wr_data.get('separation_rating', 0.5)  # Open rate
        
        return mechanics
    
    def extract_defense_mechanics(self, def_data: Dict) -> np.ndarray:
        """
        Extract Defense mechanics
        
        Returns 8-dimensional vector:
        - EPA allowed per play
        - Pressure rate
        - Turnover rate
        - Red zone stop rate
        - 3rd down stop rate
        - Deep ball defense
        - Run defense efficiency
        - Penalty rate (negative)
        """
        mechanics = np.zeros(8)
        
        mechanics[0] = -def_data.get('epa_allowed_per_play', 0.0)  # Negative (lower is better)
        mechanics[1] = def_data.get('pressure_rate', 0.25)
        mechanics[2] = def_data.get('turnover_rate', 0.12)
        mechanics[3] = def_data.get('red_zone_stop_rate', 0.4)
        mechanics[4] = def_data.get('third_down_stop_rate', 0.4)
        mechanics[5] = -def_data.get('deep_ball_allowed_rate', 0.3)  # Negative
        mechanics[6] = -def_data.get('run_epa_allowed', 0.0)  # Negative
        mechanics[7] = -def_data.get('penalty_rate', 0.08)  # Negative
        
        return mechanics
    
    def extract_team_synergy(self, team_data: Dict) -> np.ndarray:
        """
        Extract team-level synergy mechanics (hidden factors)
        
        Returns 5-dimensional vector:
        - QB-WR connection strength
        - Offensive line protection
        - Special teams efficiency
        - Coaching efficiency
        - Injury impact
        """
        mechanics = np.zeros(5)
        
        # QB-WR connection (completion rate to top WR)
        mechanics[0] = team_data.get('qb_wr_connection', 0.7)
        
        # Offensive line (sack rate, negative)
        mechanics[1] = -team_data.get('sack_rate', 0.06)
        
        # Special teams (field position, kick success)
        mechanics[2] = team_data.get('special_teams_epa', 0.0)
        
        # Coaching efficiency (timeout usage, challenge success)
        mechanics[3] = team_data.get('coaching_efficiency', 0.5)
        
        # Injury impact (negative - more injuries = worse)
        mechanics[4] = -team_data.get('injury_impact_score', 0.0)
        
        return mechanics


class MultiLayerStateSpaceModel(nn.Module):
    """
    Multi-layer state-space model for NFL parley prediction
    
    Architecture:
    Layer 1: Player mechanics → Hidden states
    Layer 2: Team synergy → Hidden states
    Layer 3: Matchup dynamics → Hidden states
    Layer 4: Parley combination → Output
    
    Each layer has attention and learns its own state-space representation
    """
    
    def __init__(self, 
                 player_feature_dim: int = 29,  # QB(8) + RB(6) + WR(7) + DEF(8)
                 team_feature_dim: int = 5,
                 matchup_feature_dim: int = 10,
                 hidden_dim: int = 16,
                 state_dim: int = 12):
        super(MultiLayerStateSpaceModel, self).__init__()
        
        self.hidden_dim = hidden_dim
        self.state_dim = state_dim
        
        # Layer 1: Player Mechanics → Hidden States
        self.player_attention = nn.MultiheadAttention(player_feature_dim, num_heads=2, batch_first=True)
        self.player_to_state = nn.Sequential(
            nn.Linear(player_feature_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, state_dim)
        )
        self.player_state_norm = nn.LayerNorm(state_dim)
        
        # Layer 2: Team Synergy → Hidden States
        self.team_attention = nn.MultiheadAttention(team_feature_dim, num_heads=1, batch_first=True)
        self.team_to_state = nn.Sequential(
            nn.Linear(team_feature_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, state_dim)
        )
        self.team_state_norm = nn.LayerNorm(state_dim)
        
        # Layer 3: Matchup Dynamics → Hidden States
        self.matchup_attention = nn.MultiheadAttention(matchup_feature_dim, num_heads=2, batch_first=True)
        self.matchup_to_state = nn.Sequential(
            nn.Linear(matchup_feature_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, state_dim)
        )
        self.matchup_state_norm = nn.LayerNorm(state_dim)
        
        # Layer 4: State Combination → Parley Prediction
        # Combines all three state representations
        combined_state_dim = state_dim * 3
        self.state_combination = nn.Sequential(
            nn.Linear(combined_state_dim, hidden_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        
        # State transition matrices (learned dynamics)
        self.A_player = nn.Parameter(torch.randn(state_dim, state_dim) * 0.1)
        self.A_team = nn.Parameter(torch.randn(state_dim, state_dim) * 0.1)
        self.A_matchup = nn.Parameter(torch.randn(state_dim, state_dim) * 0.1)
        
        self._initialize_weights()
    
    def _initialize_weights(self):
        """Initialize with Xavier uniform"""
        for module in [self.player_to_state, self.team_to_state, self.matchup_to_state, self.state_combination]:
            for layer in module:
                if isinstance(layer, nn.Linear):
                    nn.init.xavier_uniform_(layer.weight)
                    if layer.bias is not None:
                        nn.init.zeros_(layer.bias)
    
    def forward(self, player_features: torch.Tensor, 
                team_features: torch.Tensor,
                matchup_features: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through multi-layer state-space model
        
        Args:
            player_features: [batch, player_feature_dim] - Combined player mechanics
            team_features: [batch, team_feature_dim] - Team synergy
            matchup_features: [batch, matchup_feature_dim] - Matchup dynamics
        
        Returns:
            [batch, 1] - Parley win probability
        """
        batch_size = player_features.size(0)
        
        # Layer 1: Player Mechanics → State
        player_attn = player_features.unsqueeze(1)  # [batch, 1, features]
        player_attn_out, _ = self.player_attention(player_attn, player_attn, player_attn)
        player_attn_out = player_attn_out.squeeze(1)
        player_state = self.player_to_state(player_attn_out)
        # State transition: x_new = A * x_old + x
        player_state = torch.matmul(player_state, self.A_player.T) + player_state
        player_state = self.player_state_norm(player_state)
        
        # Layer 2: Team Synergy → State
        team_attn = team_features.unsqueeze(1)
        team_attn_out, _ = self.team_attention(team_attn, team_attn, team_attn)
        team_attn_out = team_attn_out.squeeze(1)
        team_state = self.team_to_state(team_attn_out)
        team_state = torch.matmul(team_state, self.A_team.T) + team_state
        team_state = self.team_state_norm(team_state)
        
        # Layer 3: Matchup Dynamics → State
        matchup_attn = matchup_features.unsqueeze(1)
        matchup_attn_out, _ = self.matchup_attention(matchup_attn, matchup_attn, matchup_attn)
        matchup_attn_out = matchup_attn_out.squeeze(1)
        matchup_state = self.matchup_to_state(matchup_attn_out)
        matchup_state = torch.matmul(matchup_state, self.A_matchup.T) + matchup_state
        matchup_state = self.matchup_state_norm(matchup_state)
        
        # Layer 4: Combine all states → Parley prediction
        combined_state = torch.cat([player_state, team_state, matchup_state], dim=1)
        output = self.state_combination(combined_state)
        output = torch.sigmoid(output)  # Probability
        
        return output


class NFLParleyDataset(Dataset):
    """Dataset for NFL parley training"""
    
    def __init__(self, parleys: List[Dict]):
        """
        Args:
            parleys: List of parley dicts with:
                - player_features: Combined QB+RB+WR+DEF mechanics
                - team_features: Team synergy
                - matchup_features: Matchup dynamics
                - won: bool (did parley win?)
        """
        self.parleys = parleys
    
    def __len__(self):
        return len(self.parleys)
    
    def __getitem__(self, idx):
        parley = self.parleys[idx]
        player_features = torch.FloatTensor(parley['player_features'])
        team_features = torch.FloatTensor(parley['team_features'])
        matchup_features = torch.FloatTensor(parley['matchup_features'])
        won = 1.0 if parley.get('won', False) else 0.0
        return player_features, team_features, matchup_features, torch.FloatTensor([won])


class NFLDataFetcher:
    """Fetches and processes NFL data for training"""
    
    def __init__(self):
        self.extractor = PlayerMechanicsExtractor()
        self.data_cache = {}
    
    def fetch_team_data(self, team_abbr: str, year: int = 2025) -> Dict:
        """Fetch team data from nflverse (nflreadpy) for 2025 season"""
        if not NFL_DATA_AVAILABLE:
            return self._mock_team_data(team_abbr)
        
        if year is None:
            year = 2025  # Default to 2025 season
        
        try:
            # Fetch play-by-play data for 2025 season
            pbp_data = nfl.load_pbp(seasons=[year])
            
            # Filter for team
            team_pbp = pbp_data[pbp_data['posteam'] == team_abbr.upper()]
            
            if team_pbp.empty:
                # Try defensive stats
                team_pbp = pbp_data[pbp_data['defteam'] == team_abbr.upper()]
            
            if team_pbp.empty:
                return self._mock_team_data(team_abbr)
            
            # Calculate EPA metrics
            offensive_epa = team_pbp[team_pbp['posteam'] == team_abbr.upper()]['epa'].mean() if not team_pbp[team_pbp['posteam'] == team_abbr.upper()].empty else 0.0
            defensive_epa = -team_pbp[team_pbp['defteam'] == team_abbr.upper()]['epa'].mean() if not team_pbp[team_pbp['defteam'] == team_abbr.upper()].empty else 0.0
            
            # Fetch team stats
            team_stats = nfl.load_team_stats(seasons=[year])
            team_row = team_stats[team_stats['team'] == team_abbr.upper()]
            
            # Calculate additional metrics
            sack_rate = 0.0
            if not team_row.empty and 'sacks' in team_row.columns and 'dropbacks' in team_row.columns:
                sacks = team_row['sacks'].iloc[0] if 'sacks' in team_row.columns else 0
                dropbacks = team_row['dropbacks'].iloc[0] if 'dropbacks' in team_row.columns else 1
                sack_rate = sacks / max(dropbacks, 1)
            
            return {
                'epa_offense': float(offensive_epa) if not np.isnan(offensive_epa) else 0.08,
                'epa_defense': float(defensive_epa) if not np.isnan(defensive_epa) else 0.05,
                'epa_rank': int(team_row['epa_rank'].iloc[0]) if not team_row.empty and 'epa_rank' in team_row.columns else 15,
                'sack_rate': float(sack_rate),
                'qb_wr_connection': 0.7,  # Calculate from completion rates if available
                'special_teams_epa': 0.0,  # Can be calculated from special teams plays
                'coaching_efficiency': 0.6,  # Can be calculated from timeout usage, challenges
                'injury_impact_score': 0.1,  # Would need injury data
                'recent_win_rate': float(team_row['win_rate'].iloc[0]) if not team_row.empty and 'win_rate' in team_row.columns else 0.5
            }
        except Exception as e:
            print(f"⚠️ Error fetching team data from nflverse: {e}")
            return self._mock_team_data(team_abbr)
    
    def fetch_player_data(self, player_name: str, position: str, year: int = 2025) -> Dict:
        """Fetch player-level data from nflverse (nflreadpy) for 2025 season"""
        if not NFL_DATA_AVAILABLE:
            return self._mock_player_data(position)
        
        if year is None:
            year = 2025
        
        try:
            # Fetch player stats for 2025 season
            player_stats = nfl.load_player_stats(seasons=[year])
            
            # Find player by name (case-insensitive, partial match)
            player_row = player_stats[
                player_stats['player_name'].str.contains(player_name, case=False, na=False)
            ]
            
            if player_row.empty:
                # Try by position if name not found
                position_players = player_stats[player_stats['position'] == position.upper()]
                if not position_players.empty:
                    # Return average stats for position
                    return self._extract_player_metrics_from_stats(position_players, position)
                return self._mock_player_data(position)
            
            # Get the most recent/most complete row
            player_row = player_row.iloc[0]
            
            return self._extract_player_metrics_from_stats(player_row.to_frame().T, position)
            
        except Exception as e:
            print(f"⚠️ Error fetching player data from nflverse: {e}")
            return self._mock_player_data(position)
    
    def _extract_player_metrics_from_stats(self, player_data, position: str) -> Dict:
        """Extract player mechanics from nflverse stats"""
        if position.upper() == 'QB':
            # Calculate QB metrics from player stats
            epa_per_dropback = float(player_data['passing_epa'].mean() / max(player_data['dropbacks'].sum(), 1)) if 'passing_epa' in player_data.columns and 'dropbacks' in player_data.columns else 0.15
            completions = player_data['completions'].sum() if 'completions' in player_data.columns else 0
            attempts = player_data['attempts'].sum() if 'attempts' in player_data.columns else 1
            completion_rate = completions / max(attempts, 1)
            
            # Under pressure stats (if available)
            pressure_rate = float(player_data['sacks'].sum() / max(player_data['dropbacks'].sum(), 1)) if 'sacks' in player_data.columns else 0.06
            completion_rate_under_pressure = max(0.4, completion_rate - 0.1)  # Estimate
            
            # Deep ball (air_yards > 20)
            deep_attempts = player_data['air_yards'].apply(lambda x: x > 20).sum() if 'air_yards' in player_data.columns else 0
            deep_completions = deep_attempts * 0.45  # Estimate
            deep_ball_accuracy = deep_completions / max(deep_attempts, 1) if deep_attempts > 0 else 0.45
            
            # Red zone (inside 20)
            red_zone_td_rate = float(player_data['passing_tds'].sum() / max(player_data['red_zone_attempts'].sum(), 1)) if 'red_zone_attempts' in player_data.columns else 0.6
            
            # 4th quarter performance (would need play-by-play)
            q4_epa = epa_per_dropback * 0.8  # Estimate
            
            # Home vs away (would need game-level data)
            home_epa = epa_per_dropback * 1.05
            away_epa = epa_per_dropback * 0.95
            
            # Weather (estimate)
            weather_epa = epa_per_dropback * 0.9
            
            # Game-winning drives (would need play-by-play)
            game_winning_drives = 0
            games_played = player_data['games'].sum() if 'games' in player_data.columns else 16
            
            return {
                'epa_per_dropback': float(epa_per_dropback),
                'completion_rate_under_pressure': float(completion_rate_under_pressure),
                'deep_ball_accuracy': float(deep_ball_accuracy),
                'red_zone_td_rate': float(red_zone_td_rate),
                'q4_epa': float(q4_epa),
                'home_epa': float(home_epa),
                'away_epa': float(away_epa),
                'weather_epa': float(weather_epa),
                'game_winning_drives': int(game_winning_drives),
                'games_played': int(games_played)
            }
        
        elif position.upper() == 'RB':
            # Calculate RB metrics
            carries = player_data['carries'].sum() if 'carries' in player_data.columns else 0
            rushing_yards = player_data['rushing_yards'].sum() if 'rushing_yards' in player_data.columns else 0
            yards_per_carry = rushing_yards / max(carries, 1)
            
            # Breakaway runs (20+ yards)
            breakaway_runs = player_data['rushing_yards'].apply(lambda x: x >= 20).sum() if 'rushing_yards' in player_data.columns else 0
            breakaway_run_rate = breakaway_runs / max(carries, 1)
            
            # Goal line (would need play-by-play)
            goal_line_td_rate = 0.65  # Estimate
            
            # Receiving
            receptions = player_data['receptions'].sum() if 'receptions' in player_data.columns else 0
            targets = player_data['targets'].sum() if 'targets' in player_data.columns else 1
            reception_rate = receptions / max(targets, 1)
            
            # Fumbles
            fumbles = player_data['fumbles'].sum() if 'fumbles' in player_data.columns else 0
            fumble_rate = fumbles / max(carries + receptions, 1)
            
            # Usage
            touches = carries + receptions
            usage_rate = touches / max(player_data['games'].sum() * 60, 1) if 'games' in player_data.columns else 0.4
            
            return {
                'yards_per_carry': float(yards_per_carry),
                'breakaway_run_rate': float(breakaway_run_rate),
                'goal_line_td_rate': float(goal_line_td_rate),
                'reception_rate': float(reception_rate),
                'fumble_rate': float(fumble_rate),
                'usage_rate': float(usage_rate)
            }
        
        elif position.upper() == 'WR':
            # Calculate WR metrics
            targets = player_data['targets'].sum() if 'targets' in player_data.columns else 0
            receptions = player_data['receptions'].sum() if 'receptions' in player_data.columns else 0
            target_share = targets / max(player_data['team_targets'].sum(), 1) if 'team_targets' in player_data.columns else 0.25
            catch_rate = receptions / max(targets, 1)
            
            # YAC
            yac = player_data['receiving_yards_after_catch'].sum() if 'receiving_yards_after_catch' in player_data.columns else 0
            yac_per_reception = yac / max(receptions, 1)
            
            # Deep targets (air_yards > 15)
            deep_targets = player_data['air_yards'].apply(lambda x: x > 15).sum() if 'air_yards' in player_data.columns else 0
            deep_target_rate = deep_targets / max(targets, 1)
            
            # Red zone targets
            red_zone_targets = player_data['red_zone_targets'].sum() if 'red_zone_targets' in player_data.columns else 0
            red_zone_target_rate = red_zone_targets / max(targets, 1)
            
            # Drops
            drops = player_data['drops'].sum() if 'drops' in player_data.columns else 0
            drop_rate = drops / max(targets, 1)
            
            # Separation (estimate from catch rate)
            separation_rating = catch_rate * 1.1  # Higher catch rate = better separation
            
            return {
                'target_share': float(target_share),
                'catch_rate': float(catch_rate),
                'yac_per_reception': float(yac_per_reception),
                'deep_target_rate': float(deep_target_rate),
                'red_zone_target_rate': float(red_zone_target_rate),
                'drop_rate': float(drop_rate),
                'separation_rating': float(separation_rating)
            }
        
        else:  # DEF
            # Defense stats (would need team defense data)
            return self._mock_player_data('DEF')
    
    def build_parley_features(self, parley_bets: List[Dict]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Build features for a parley from multiple bets
        
        Args:
            parley_bets: List of bet dicts in the parley
        
        Returns:
            (player_features, team_features, matchup_features)
        """
        # Combine player mechanics from all bets in parley
        player_mechanics_list = []
        team_synergy_list = []
        matchup_dynamics_list = []
        
        for bet in parley_bets:
            # Extract player mechanics
            qb_mech = self.extractor.extract_qb_mechanics(bet.get('qb_data', {}))
            rb_mech = self.extractor.extract_rb_mechanics(bet.get('rb_data', {}))
            wr_mech = self.extractor.extract_wr_mechanics(bet.get('wr_data', {}))
            def_mech = self.extractor.extract_defense_mechanics(bet.get('def_data', {}))
            
            # Combine player mechanics (29 dims: 8+6+7+8)
            combined_player = np.concatenate([qb_mech, rb_mech, wr_mech, def_mech])
            player_mechanics_list.append(combined_player)
            
            # Extract team synergy
            team_syn = self.extractor.extract_team_synergy(bet.get('team_data', {}))
            team_synergy_list.append(team_syn)
            
            # Extract matchup dynamics
            matchup = self._extract_matchup_dynamics(bet)
            matchup_dynamics_list.append(matchup)
        
        # Average across all bets in parley (or use max/min for key metrics)
        player_features = np.mean(player_mechanics_list, axis=0) if player_mechanics_list else np.zeros(29)
        team_features = np.mean(team_synergy_list, axis=0) if team_synergy_list else np.zeros(5)
        matchup_features = np.mean(matchup_dynamics_list, axis=0) if matchup_dynamics_list else np.zeros(10)
        
        return player_features, team_features, matchup_features
    
    def _extract_matchup_dynamics(self, bet: Dict) -> np.ndarray:
        """Extract matchup-specific dynamics"""
        dynamics = np.zeros(10)
        
        # Offense vs Defense matchup
        team_epa = bet.get('team_data', {}).get('epa_offense', 0.0)
        opp_def_epa = bet.get('opponent_data', {}).get('epa_defense', 0.0)
        dynamics[0] = team_epa - opp_def_epa  # Advantage
        
        # Defense vs Offense matchup
        team_def_epa = bet.get('team_data', {}).get('epa_defense', 0.0)
        opp_epa = bet.get('opponent_data', {}).get('epa_offense', 0.0)
        dynamics[1] = team_def_epa - opp_epa  # Advantage (negative is good for defense)
        
        # Home field advantage
        dynamics[2] = 1.0 if bet.get('home', False) else 0.0
        
        # Rest advantage
        dynamics[3] = bet.get('rest_advantage', 0.0) / 7.0
        
        # Weather impact
        dynamics[4] = bet.get('weather_factor', 0.0)
        
        # Divisional game
        dynamics[5] = 1.0 if bet.get('divisional', False) else 0.0
        
        # Recent form difference
        team_form = bet.get('team_data', {}).get('recent_win_rate', 0.5)
        opp_form = bet.get('opponent_data', {}).get('recent_win_rate', 0.5)
        dynamics[6] = team_form - opp_form
        
        # Injury impact
        team_injuries = bet.get('team_data', {}).get('injury_impact', 0.0)
        opp_injuries = bet.get('opponent_data', {}).get('injury_impact', 0.0)
        dynamics[7] = opp_injuries - team_injuries  # Opponent injuries = advantage
        
        # Coaching matchup
        dynamics[8] = bet.get('coaching_advantage', 0.0)
        
        # Historical head-to-head
        dynamics[9] = bet.get('h2h_advantage', 0.0)
        
        return dynamics
    
    def _mock_team_data(self, team_abbr: str) -> Dict:
        """Mock team data for testing"""
        return {
            'epa_offense': 0.08,
            'epa_defense': 0.05,
            'epa_rank': 10,
            'qb_wr_connection': 0.7,
            'sack_rate': 0.05,
            'special_teams_epa': 0.0,
            'coaching_efficiency': 0.6,
            'injury_impact_score': 0.1
        }
    
    def _mock_player_data(self, position: str) -> Dict:
        """Mock player data for testing"""
        if position == 'QB':
            return {
                'epa_per_dropback': 0.15,
                'completion_rate_under_pressure': 0.55,
                'deep_ball_accuracy': 0.45,
                'red_zone_td_rate': 0.6,
                'q4_epa': 0.12,
                'home_epa': 0.16,
                'away_epa': 0.14,
                'weather_epa': 0.13,
                'game_winning_drives': 3,
                'games_played': 16
            }
        elif position == 'RB':
            return {
                'yards_per_carry': 4.5,
                'breakaway_run_rate': 0.12,
                'goal_line_td_rate': 0.65,
                'reception_rate': 0.75,
                'fumble_rate': 0.015,
                'usage_rate': 0.4
            }
        elif position == 'WR':
            return {
                'target_share': 0.25,
                'catch_rate': 0.68,
                'yac_per_reception': 5.2,
                'deep_target_rate': 0.22,
                'red_zone_target_rate': 0.18,
                'drop_rate': 0.04,
                'separation_rating': 0.65
            }
        else:  # DEF
            return {
                'epa_allowed_per_play': -0.05,
                'pressure_rate': 0.28,
                'turnover_rate': 0.14,
                'red_zone_stop_rate': 0.45,
                'third_down_stop_rate': 0.42,
                'deep_ball_allowed_rate': 0.25,
                'run_epa_allowed': -0.03,
                'penalty_rate': 0.07
            }


class NFLParleyTrainer:
    """Trainer for NFL parley prediction model"""
    
    def __init__(self, model: MultiLayerStateSpaceModel, device: str = 'cpu'):
        self.model = model
        self.device = device
        self.model.to(device)
        self.optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
        self.criterion = nn.BCELoss()  # Binary cross-entropy for win/loss
        self.training_history = []
    
    def train(self, parleys: List[Dict], epochs: int = 20, batch_size: int = 32):
        """Train model on parley data"""
        if not PYTORCH_AVAILABLE:
            print("⚠️ PyTorch not available. Cannot train.")
            return
        
        dataset = NFLParleyDataset(parleys)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        self.model.train()
        
        for epoch in range(epochs):
            total_loss = 0.0
            num_batches = 0
            correct = 0
            total = 0
            
            for player_feat, team_feat, matchup_feat, targets in dataloader:
                player_feat = player_feat.to(self.device)
                team_feat = team_feat.to(self.device)
                matchup_feat = matchup_feat.to(self.device)
                targets = targets.to(self.device)
                
                # Forward pass
                predictions = self.model(player_feat, team_feat, matchup_feat)
                
                # Loss
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
                'accuracy': accuracy
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
            'training_history': self.training_history
        }, filepath)
        print(f"✅ Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.training_history = checkpoint.get('training_history', [])
        print(f"✅ Model loaded from {filepath}")

