# Counterfactual and Explainable Credit Decisioning

A research-oriented implementation of explainable artificial intelligence (XAI) techniques for credit risk assessment. This project demonstrates how machine learning models can provide transparent, interpretable decisions in financial lending contexts—addressing the critical need for algorithmic accountability in high-stakes automated systems.

## Motivation

Credit decisioning systems increasingly rely on machine learning algorithms to evaluate loan applications. While these models often achieve superior predictive accuracy compared to traditional rule-based approaches, they introduce a fundamental challenge: opacity. When a loan application is rejected, neither the applicant nor the lending institution can easily understand why the model arrived at that conclusion.

This lack of transparency poses several problems. From a regulatory perspective, financial institutions must comply with fair lending laws that require explanations for adverse actions. From an ethical standpoint, individuals have a reasonable expectation to understand decisions that significantly affect their lives. And from a practical perspective, opaque models are difficult to audit, debug, and trust.

This project addresses these challenges by combining a high-performance gradient boosting classifier with two complementary explanation techniques: SHAP values for feature attribution and DiCE counterfactuals for actionable recourse.

## Approach

### Predictive Modeling

The classification task predicts whether a loan applicant presents a "good" or "bad" credit risk based on demographic and financial attributes. We employ XGBoost, a gradient boosting framework that constructs an ensemble of decision trees optimized through gradient descent. XGBoost was selected for its strong empirical performance on tabular data and its compatibility with tree-based explanation methods.

Hyperparameter optimization was conducted using Optuna, a Bayesian optimization framework that efficiently searches the parameter space by building a probabilistic model of the objective function. This approach typically converges to high-quality configurations faster than grid search or random search alternatives.

### Feature Attribution with SHAP

To explain individual predictions, we compute SHAP (SHapley Additive exPlanations) values using the TreeExplainer algorithm. SHAP values originate from cooperative game theory—specifically, they represent each feature's marginal contribution to the prediction, averaged over all possible feature orderings.

For a given prediction, SHAP provides:
- **Direction of influence**: Whether each feature pushes the prediction toward approval or rejection
- **Magnitude of influence**: How strongly each feature affects the outcome relative to others
- **Additivity**: SHAP values sum to the difference between the model's prediction and its base rate

The TreeExplainer variant exploits the structure of tree ensembles to compute exact Shapley values in polynomial time, making it practical for real-time applications.

### Counterfactual Explanations with DiCE

While SHAP explains why a particular decision was made, counterfactual explanations address a different question: what would need to change for the outcome to be different? This is particularly valuable for rejected applicants who want to understand how they might improve their application.

We generate counterfactuals using DiCE (Diverse Counterfactual Explanations), which formulates the problem as a constrained optimization task. DiCE seeks minimal perturbations to the input features that would flip the model's prediction, while respecting several constraints:

- **Actionability**: Only features that the applicant can realistically change are modified (e.g., loan amount and duration), while immutable characteristics (e.g., age and sex) remain fixed
- **Diversity**: Multiple counterfactual suggestions are generated to provide the applicant with different viable paths forward
- **Plausibility**: Suggested changes remain within reasonable ranges observed in the training data

## Dataset

The model is trained on the German Credit Dataset, a widely-used benchmark in credit scoring research originally compiled by Professor Hans Hofmann at the University of Hamburg. The dataset contains 1,000 loan applications characterized by 20 attributes spanning demographic information, financial status, and loan characteristics.

| Attribute | Description | Type |
|-----------|-------------|------|
| Age | Applicant's age in years | Numeric |
| Sex | Male or female | Categorical |
| Job | Employment category (0-3 scale) | Ordinal |
| Housing | Own, rent, or free accommodation | Categorical |
| Saving accounts | Status of savings (little to rich) | Categorical |
| Checking account | Status of checking account | Categorical |
| Credit amount | Requested loan amount (DM) | Numeric |
| Duration | Loan term in months | Numeric |
| Purpose | Loan purpose (car, education, etc.) | Categorical |
| Risk | Good or bad credit risk (target) | Binary |

The dataset exhibits class imbalance, with 70% of applications classified as "good" risk and 30% as "bad" risk. This distribution reflects realistic lending scenarios where defaults are relatively rare events.

## System Architecture

The implementation consists of three primary components:

### Model Training Pipeline

The Jupyter notebook (`explainable_loan_approval_xgboost_optuna.ipynb`) handles data preprocessing, model training, and hyperparameter optimization. The pipeline includes:

1. **Preprocessing**: Numeric features are standardized using z-score normalization; categorical features are one-hot encoded
2. **Optimization**: Optuna conducts 100 trials of Bayesian optimization over XGBoost hyperparameters
3. **Evaluation**: Performance is assessed using precision, recall, F1-score, and ROC-AUC on a held-out test set
4. **Artifact Export**: The trained model, preprocessor, and study results are serialized for deployment

### Backend API

A FastAPI application (`app/`) serves predictions and explanations through a RESTful interface. The API provides:

- `POST /predict`: Returns the approval decision, probability score, and SHAP-based feature attributions
- `POST /counterfactuals`: Generates DiCE counterfactual recommendations for rejected applications
- `GET /health`: Reports service status and model availability

The backend is containerized using Docker and deployed to Hugging Face Spaces for public accessibility. The Mangum adapter enables optional deployment to AWS Lambda for serverless operation.

### Frontend Interface

A Next.js web application (`frontend/`) provides an interactive demonstration of the system. Users can input loan application parameters through a form interface and receive:

- The model's binary prediction (Approved/Rejected) with probability
- A visualization of SHAP feature contributions as a horizontal bar chart
- For rejected applications, a comparison table showing counterfactual recommendations

The interface is designed with a research presentation aesthetic, emphasizing clarity and interpretability over commercial polish.

## Running the Project

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Docker (optional, for containerized deployment)

### Backend Setup

```bash
cd counterfactual-explainable-credit-decisions

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000` and expects the backend API at the URL specified in `.env.production`.

### Docker Deployment

```bash
# Build and run the backend container
docker build -t credit-api .
docker run -p 7860:7860 credit-api
```

## API Reference

### Predict Endpoint

**Request:**
```http
POST /predict
Content-Type: application/json

{
  "Age": 35,
  "Sex": "male",
  "Job": 2,
  "Housing": "own",
  "Saving_accounts": "moderate",
  "Checking_account": "little",
  "Credit_amount": 5000,
  "Duration": 24,
  "Purpose": "car"
}
```

**Response:**
```json
{
  "prediction": "Approved",
  "approval_probability": 0.7421,
  "top_positive_factors": [
    {"feature": "Age", "impact": 0.42, "direction": "positive"},
    {"feature": "Housing", "impact": 0.18, "direction": "positive"}
  ],
  "top_negative_factors": [
    {"feature": "Duration", "impact": -0.31, "direction": "negative"}
  ],
  "all_feature_impacts": [...]
}
```

### Counterfactuals Endpoint

**Request:**
```http
POST /counterfactuals
Content-Type: application/json

{
  "Age": 25,
  "Sex": "female",
  "Job": 1,
  "Housing": "rent",
  "Saving_accounts": "little",
  "Checking_account": "little",
  "Credit_amount": 8000,
  "Duration": 48,
  "Purpose": "car"
}
```

**Response:**
```json
{
  "original_prediction": "Rejected",
  "original_probability": 0.31,
  "counterfactual_recommendations": [
    {
      "Credit_amount": 4500,
      "Duration": 24,
      "Saving_accounts": "moderate",
      "Checking_account": "moderate",
      "prediction": "Approved"
    }
  ],
  "message": "3 counterfactual recommendations generated successfully"
}
```

## Technical Considerations

### Interpretability vs. Accuracy Trade-offs

This implementation prioritizes interpretability without significantly sacrificing predictive performance. XGBoost achieves competitive accuracy while remaining compatible with SHAP's TreeExplainer, which provides exact (not approximate) Shapley values. More complex models like deep neural networks would require sampling-based approximations that introduce variance into the explanations.

### Limitations of Counterfactual Explanations

Counterfactual recommendations should be understood as model-based suggestions, not guarantees. The recommendations indicate what feature changes would flip the model's prediction, but they do not account for:

- Changes in the applicant's actual creditworthiness
- Future model updates that might alter decision boundaries
- Unobserved confounding factors not captured in the training data

Additionally, some suggested changes (like improving savings account status) may not be immediately actionable, even though they are theoretically possible for the applicant to achieve over time.

### Fairness Considerations

While this implementation demonstrates explainability techniques, it does not explicitly address fairness constraints. The German Credit Dataset contains protected attributes (sex, age) that could lead to discriminatory outcomes. Production deployments should incorporate fairness auditing and potentially constrain the model to satisfy demographic parity or equalized odds criteria.

## References

### Explainability Methods

- Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30. https://github.com/slundberg/shap

- Mothilal, R. K., Sharma, A., & Tan, C. (2020). Explaining machine learning classifiers through diverse counterfactual explanations. *Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency*, 607-617. https://github.com/interpretml/DiCE

### Machine Learning

- Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785-794.

- Akiba, T., Sano, S., Yanase, T., Ohta, T., & Koyama, M. (2019). Optuna: A next-generation hyperparameter optimization framework. *Proceedings of the 25th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 2623-2631.

### Dataset

- Hofmann, H. (1994). Statlog (German Credit Data). UCI Machine Learning Repository. https://archive.ics.uci.edu/ml/datasets/statlog+(german+credit+data)

## Project Structure

```
├── counterfactual-explainable-credit-decisions/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── schemas.py           # Pydantic models
│   │   ├── model_loader.py      # Model loading utilities
│   │   ├── explainability.py    # SHAP explanation generation
│   │   └── utils.py             # Helper functions
│   ├── model_artifacts/
│   │   ├── xgboost_loan_model.pkl
│   │   └── preprocessor.pkl
│   ├── training_data.csv
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main application component
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Styling
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── types.ts             # TypeScript definitions
│   └── package.json
└── plot/                        # Visualization outputs from training
```

## Live Demo

The application is deployed and accessible at:

- **Frontend**: Deployed via Vercel
- **Backend API**: https://huggingface.co/spaces/Himash946/counterfactual-explainable-credit-decisions

## License

This project is released under the MIT License.

## Acknowledgments

This work was developed as a research demonstration of explainable AI techniques in financial applications. The implementation draws on established open-source libraries and publicly available datasets to illustrate how modern machine learning systems can be made more transparent and accountable.
