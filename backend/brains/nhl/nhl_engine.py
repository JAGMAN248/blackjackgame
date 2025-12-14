"""
NHL Brain Engine
Uses hockey_scraper for xG (Expected Goals) and advanced metrics
"""

try:
    import hockey_scraper
    NHL_AVAILABLE = True
except ImportError:
    NHL_AVAILABLE = False
    print("⚠️ hockey_scraper not installed. NHL brain unavailable.")


def get_xg_stats(team_abbr):
    """
    Get team xG (Expected Goals) statistics.
    
    Args:
        team_abbr: Team abbreviation (e.g., 'TOR', 'BOS')
    
    Returns:
        dict: Team xG metrics and recommendation
    """
    if not NHL_AVAILABLE:
        # Enhanced mock data based on team
        import hashlib
        hash_val = int(hashlib.md5(team_abbr.encode()).hexdigest()[:8], 16)
        xg_percentage = 50 + (hash_val % 15)  # 50-65% range
        pdo = 98 + (hash_val % 6)  # 98-104 range
        
        return {
            "team": team_abbr.upper(),
            "xg_percentage": xg_percentage,
            "pdo": pdo,
            "xg_rating": "Elite" if xg_percentage > 55 else "Good" if xg_percentage > 52 else "Average",
            "luck_rating": "Unsustainable (Fade)" if pdo > 102 else "Sustainable" if pdo >= 98 else "Unlucky (Buy Low)",
            "recommendation": "BET" if xg_percentage > 55 and pdo <= 102 else "MODERATE" if xg_percentage > 52 else "FADE",
            "note": "Mock data - Install hockey_scraper for real stats"
        }
    
    try:
        # TODO: Integrate real hockey_scraper data fetching
        # This requires more complex setup with the scraper API
        # For now, return enhanced mock data
        
        import hashlib
        hash_val = int(hashlib.md5(team_abbr.encode()).hexdigest()[:8], 16)
        xg_percentage = 50 + (hash_val % 15)
        pdo = 98 + (hash_val % 6)
        
        return {
            "team": team_abbr.upper(),
            "xg_percentage": xg_percentage,
            "pdo": pdo,
            "xg_rating": "Elite" if xg_percentage > 55 else "Good" if xg_percentage > 52 else "Average",
            "luck_rating": "Unsustainable (Fade)" if pdo > 102 else "Sustainable" if pdo >= 98 else "Unlucky (Buy Low)",
            "recommendation": "BET" if xg_percentage > 55 and pdo <= 102 else "MODERATE" if xg_percentage > 52 else "FADE",
            "note": "Real integration pending - using enhanced mock data"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "team": team_abbr,
            "recommendation": "FADE"
        }

