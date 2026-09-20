from pydantic import BaseModel


class SpeakingFeedbackRequest(BaseModel):
    question: str
    transcript: str


class GrammarNote(BaseModel):
    original: str
    suggestion: str
    explanation: str


class SpeakingFeedbackResponse(BaseModel):
    overall_score: int
    strengths: list[str]
    # The prompt tells the model to omit this entirely when grammar is
    # already correct, so it must default to empty rather than being
    # required - otherwise every grammatically-correct answer 500s.
    grammar_notes: list[GrammarNote] = []
    filler_word_count: int
    vocabulary_suggestions: list[str]
    improved_answer: str
