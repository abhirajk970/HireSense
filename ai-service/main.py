from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
import pdfplumber
import io
import re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# Load the English NLP model for Named Entity Recognition
try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    print("Downloading language model for the spacy POS tagger\n"
          "(don't worry, this will only happen once)")
    from spacy.cli import download
    download("en_core_web_md")
    nlp = spacy.load("en_core_web_md")


def extract_cgpa(text):
    match = re.search(r'(?:CGPA|GPA)[^\d]*(\d\.\d+)', text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 0.0

def extract_experience(text):
    match = re.search(r'(\d+)(?:\+)?\s*(?:years|yrs?)(?:\s+of)?\s+experience', text, re.IGNORECASE)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            pass
    return 0

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...), job_description: Optional[str] = Form(None)):
    contents = await file.read()
    pdf = pdfplumber.open(io.BytesIO(contents))

    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""

    skills_db = ["React", "Node", "MongoDB", "Python", "C++", "Docker", "SQL", "Express", "FastAPI", "Java", "AWS", "Git", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind"]
    detected = []

    for skill in skills_db:
        if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
            detected.append(skill)

    cgpa = extract_cgpa(text)
    years_expr = extract_experience(text)

    # ML: Named Entity Recognition
    doc = nlp(text)
    organizations = list(set([ent.text for ent in doc.ents if ent.label_ == "ORG"]))
    locations = list(set([ent.text for ent in doc.ents if ent.label_ == "GPE"]))
    
    # ML: Semantic Match via TF-IDF Cosine Similarity
    semantic_match_score = 0
    if job_description:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([job_description, text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        semantic_match_score = float(similarity[0][0]) * 100

    return {
        "detected_skills": detected,
        "cgpa": cgpa,
        "years_experience": years_expr,
        "organizations": organizations[:10], # Cap to avoid massive payloads
        "locations": locations[:10],
        "semantic_match_score": round(semantic_match_score, 2),
        "text_length": len(text)
    }