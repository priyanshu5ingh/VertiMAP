"""
AI/ML API endpoints for automated feature extraction.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.models import ulpin as models
from ml.building_extraction import (
    BuildingExtractor,
    FloorSegmenter,
    TopologyValidator,
    BuildingDetection,
    initialize_ml_models
)

router = APIRouter(
    tags=["machine learning"]
)

# Initialize ML models on module load
try:
    initialize_ml_models()
except Exception as e:
    print(f"Warning: Could not initialize ML models: {e}")


@router.post("/extract-buildings", response_model=List[Dict[str, Any]])
def extract_buildings_from_image(
    file: UploadFile = File(...),
    georeference: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Extract buildings from uploaded satellite/drone imagery using AI/ML.

    Args:
        file: Image file (satellite/drone imagery)
        georeference: Optional JSON string with georeferencing info

    Returns:
        List of detected buildings with their properties
    """
    # Parse georeference if provided
    geo_dict = None
    if georeference:
        try:
            geo_dict = json.loads(georeference)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid georeference format. Must be valid JSON."
            )

    # Read image file
    try:
        contents = file.file.read()
        # In a real implementation, we'd process the image data
        # For this mock, we'll just simulate processing
        import numpy as np
        from PIL import Image
        import io

        # Convert bytes to PIL Image then to numpy array
        image = Image.open(io.BytesIO(contents))
        image_data = np.array(image)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process image file: {str(e)}"
        )
    finally:
        file.file.close()

    # Extract buildings using AI/ML
    try:
        buildings = BuildingExtractor().extract_buildings(image_data, geo_dict)

        # Convert to JSON-serializable format
        result = []
        for building in buildings:
            result.append({
                'id': building.id,
                'confidence': building.confidence,
                'bbox': building.bbox,
                'footprint_wkt': building.footprint_wkt,
                'building_type': building.building_type.value,
                'estimated_height': building.estimated_height,
                'num_floors': building.num_floors,
                'area_sqm': building.area_sqm
            })

        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Building extraction failed: {str(e)}"
        )


@router.post("/segment-floors", response_model=List[Dict[str, Any]])
def segment_building_floors(
    building_id: int,
    db: Session = Depends(get_db)
):
    """
    Segment floors in a building using AI/ML.

    Args:
        building_id: ID of the building to segment

    Returns:
        List of floor segments with their properties
    """
    # Verify building exists
    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=404,
            detail="Building not found"
        )

    # In a real implementation, we'd get the building's 3D mesh/data
    # For this mock, we'll simulate having a mesh
    dummy_mesh = None  # Placeholder for actual 3D mesh data

    # Segment floors using AI/ML
    try:
        floors = FloorSegmenter().segment_floors(dummy_mesh)

        # Add building_id to each floor
        for floor in floors:
            floor['building_id'] = building_id

        return floors
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Floor segmentation failed: {str(e)}"
        )


@router.post("/validate-topology", response_model=Dict[str, Any])
def validate_spatial_topology(
    feature_ids: List[int],
    feature_type: str = "parcel",
    db: Session = Depends(get_db)
):
    """
    Validate topological relationships between spatial features using AI/ML.

    Args:
        feature_ids: List of feature IDs to validate
        feature_type: Type of features (parcel, building, etc.)

    Returns:
        Validation results with any topological errors found
    """
    # Verify features exist
    if feature_type == "parcel":
        features = db.query(models.Parcel).filter(models.Parcel.id.in_(feature_ids)).all()
    elif feature_type == "building":
        features = db.query(models.Building).filter(models.Building.id.in_(feature_ids)).all()
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported feature type: {feature_type}"
        )

    if len(features) != len(feature_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more features not found"
        )

    # Convert features to format expected by validator
    feature_dicts = []
    for feature in features:
        feature_dict = {
            'id': feature.id,
            # Add other relevant properties as needed
        }
        feature_dicts.append(feature_dict)

    # Validate topology using AI/ML
    try:
        validation_result = TopologyValidator().validate_topology(feature_dicts)
        return validation_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Topology validation failed: {str(e)}"
        )


@router.get("/model-info")
def get_ml_model_info():
    """
    Get information about the loaded ML models.

    Returns:
        Information about available ML models and their status
    """
    return {
        "building_extractor": {
            "model_version": BuildingExtractor().model_version,
            "is_loaded": BuildingExtractor().is_loaded,
            "supported_building_types": [bt.value for bt in BuildingType]
        },
        "floor_segmenter": {
            "is_loaded": FloorSegmenter().is_loaded
        },
        "topology_validator": {
            "is_loaded": TopologyValidator().is_loaded
        }
    }