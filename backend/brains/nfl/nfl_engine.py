"""
NFL Brain Engine
Uses nfl_data_py for EPA and advanced stats analysis
"""

try:
    import nfl_data_py as nfl
    NFL_AVAILABLE = True
except ImportError:
    NFL_AVAILABLE = False
    print("⚠️ nfl_data_py not installed. NFL brain unavailable.")


def get_team_efficiency(team_abbr, year=None):
    """
    Get team efficiency metrics using EPA (Expected Points Added).
    
    Args:
        team_abbr: Team abbreviation (e.g., 'KC', 'BUF')
        year: Season year (defaults to current year)
    
    Returns:
        dict: Team efficiency metrics and recommendation
    """
    if not NFL_AVAILABLE:
        return {
            "error": "NFL data library not available",
            "team": team_abbr,
            "recommendation": "FADE"
        }
    
    try:
        from datetime import datetime
        if year is None:
            year = datetime.now().year
        
        # Fetch seasonal data
        print(f"📊 Fetching NFL data for {year} season...")
        data = nfl.import_seasonal_data([year])
        
        # Find team data
        team_data = data[data['team'] == team_abbr.upper()]
        
        if team_data.empty:
            # Try alternative team name formats
            if 'team_abbr' in data.columns:
                team_data = data[data['team_abbr'] == team_abbr.upper()]
            if team_data.empty:
                return {
                    "error": f"Team {team_abbr} not found in {year} data",
                    "team": team_abbr,
                    "recommendation": "FADE"
                }
        
        # Extract EPA metrics - try multiple column names
        epa_offense = 0
        epa_defense = 0
        epa_rank = 15
        
        if 'epa_per_play' in team_data.columns:
            epa_offense = float(team_data['epa_per_play'].iloc[0])
        elif 'epa_pass' in team_data.columns:
            epa_offense = float(team_data['epa_pass'].iloc[0])
        elif 'off_epa' in team_data.columns:
            epa_offense = float(team_data['off_epa'].iloc[0])
        
        if 'def_epa_per_play' in team_data.columns:
            epa_defense = float(team_data['def_epa_per_play'].iloc[0])
        elif 'def_epa' in team_data.columns:
            epa_defense = float(team_data['def_epa'].iloc[0])
        
        if 'epa_rank' in team_data.columns:
            epa_rank = int(team_data['epa_rank'].iloc[0])
        elif 'off_rank' in team_data.columns:
            epa_rank = int(team_data['off_rank'].iloc[0])
        
        # Determine recommendation
        if epa_offense > 0.1:
            recommendation = "BET"
            confidence = "High"
        elif epa_offense > 0.05:
            recommendation = "MODERATE"
            confidence = "Medium"
        else:
            recommendation = "FADE"
            confidence = "Low"
        
        print(f"✅ Found {team_abbr}: EPA={epa_offense}, Rank={epa_rank}")
        
        return {
            "team": team_abbr.upper(),
            "year": year,
            "epa_offense": epa_offense,
            "epa_defense": epa_defense,
            "epa_rank": epa_rank,
            "recommendation": recommendation,
            "confidence": confidence
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "team": team_abbr,
            "recommendation": "FADE"
        }

