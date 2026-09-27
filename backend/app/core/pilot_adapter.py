"""
Real Pilot Data Adapter for VertiMap Backend API.
Loads and serves authoritative pilot dataset from data/processed/real_pilot_data.json
"""

import os
import json
from typing import Dict, Any, List, Optional

# Locate real_pilot_data.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_FILE_PATH = os.path.join(BASE_DIR, "data", "processed", "real_pilot_data.json")

_pilot_cache: Optional[Dict[str, Any]] = None

def load_pilot_data() -> Dict[str, Any]:
    global _pilot_cache
    if _pilot_cache is not None:
        return _pilot_cache

    if os.path.exists(DATA_FILE_PATH):
        with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
            _pilot_cache = json.load(f)
            return _pilot_cache
    else:
        # Fallback empty structure if file not found
        return {
            "metadata": {
                "pilot_name": "Bengaluru Central Pilot Sector",
                "projected_crs": "EPSG:32643"
            },
            "parcels": [],
            "buildings": [],
            "floors": [],
            "units": [],
            "underground": [],
            "validations": {},
            "source_comparisons": {}
        }

def get_pilot_metadata() -> Dict[str, Any]:
    return load_pilot_data().get("metadata", {})

def get_all_parcels() -> List[Dict[str, Any]]:
    return load_pilot_data().get("parcels", [])

def get_parcel_by_id(parcel_id: str) -> Optional[Dict[str, Any]]:
    for p in get_all_parcels():
        if p.get("id") == parcel_id or p.get("source_parcel_id") == parcel_id:
            return p
    return None

def get_all_buildings() -> List[Dict[str, Any]]:
    return load_pilot_data().get("buildings", [])

def get_building_by_id(bldg_id: str) -> Optional[Dict[str, Any]]:
    for b in get_all_buildings():
        if b.get("id") == bldg_id or b.get("code") == bldg_id:
            return b
    return None

def get_all_floors() -> List[Dict[str, Any]]:
    return load_pilot_data().get("floors", [])

def get_all_units() -> List[Dict[str, Any]]:
    return load_pilot_data().get("units", [])

def get_all_underground() -> List[Dict[str, Any]]:
    return load_pilot_data().get("underground", [])

def get_validations_for_building(bldg_id: str) -> List[Dict[str, Any]]:
    validations_map = load_pilot_data().get("validations", {})
    return validations_map.get(bldg_id, [])

def get_source_comparison_for_building(bldg_id: str) -> Optional[Dict[str, Any]]:
    source_map = load_pilot_data().get("source_comparisons", {})
    return source_map.get(bldg_id)
