import re

def verify_document(text: str, document_type: str) -> dict:
    """
    Core engine for verifying documents via textual analysis.
    Returns status (approved, flagged, rejected) based on fraud triggers.
    """
    fraud_score = 0
    extracted_data = {}

    if document_type == "death_certificate":
        if "death" not in text.lower():
            fraud_score += 40
        
        # Look for names and dates
        name_match = re.search(r"(?i)Name\s*:\s*(.*)", text)
        date_match = re.search(r"(?i)Date of Death\s*:\s*(.*)", text)

        if name_match:
            extracted_data["name"] = name_match.group(1).strip()
        else:
            fraud_score += 30

        if date_match:
            extracted_data["date_of_death"] = date_match.group(1).strip()
        else:
            fraud_score += 30

    elif document_type == "id_proof":
        if "government" not in text.lower():
            fraud_score += 40

    status = "approved"

    if fraud_score > 60:
        status = "rejected"
    elif fraud_score > 30:
        status = "flagged"

    return {
        "status": status,
        "fraud_score": fraud_score,
        "extracted_data": extracted_data
    }