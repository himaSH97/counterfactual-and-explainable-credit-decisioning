# Explainable AI Loan Approval API

A production-ready REST API for loan approval predictions with SHAP-based explainability, built with FastAPI and XGBoost.

## Overview

This API provides:
- **Loan Approval Prediction**: XGBoost-based binary classification
- **Explainable AI**: SHAP (SHapley Additive exPlanations) values for each prediction
- **Feature Impacts**: Understand which factors influence approval/rejection decisions
- **AWS Lambda Ready**: Seamless deployment to serverless infrastructure

## Architecture

```
project/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── main.py               # FastAPI application & endpoints
│   ├── schemas.py            # Pydantic request/response models
│   ├── model_loader.py       # Model loading & caching
│   ├── explainability.py     # SHAP explanation generation
│   └── utils.py              # Utility functions
├── models/
│   └── xgb_pipeline.pkl      # Trained XGBoost pipeline
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container configuration
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web Framework | FastAPI |
| ML Model | XGBoost |
| Explainability | SHAP TreeExplainer |
| Preprocessing | scikit-learn Pipeline |
| Serialization | joblib |
| Data Processing | pandas, NumPy |
| Serverless | Mangum (AWS Lambda) |
| Container | Docker |

## Installation

### Prerequisites

- Python 3.9+
- pip or conda

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd loan-approval-api
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Add your trained model**:
   
   Place your trained sklearn pipeline at `models/xgb_pipeline.pkl`.
   
   The pipeline should contain:
   - `preprocessor`: sklearn ColumnTransformer or similar
   - `classifier`: XGBoost classifier

## Running Locally

### Using Uvicorn (Development)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Using Python

```bash
python -m app.main
```

The API will be available at `http://localhost:8000`.

## API Documentation

Once running, access the interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Health Check

```http
GET /
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Detailed Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "feature_count": 15,
  "version": "1.0.0"
}
```

### Predict Loan Approval

```http
POST /predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "Age": 35,
  "Sex": "male",
  "Job": 2,
  "Housing": "own",
  "Saving_accounts": "moderate",
  "Checking_account": "little",
  "Credit_amount": 5000.0,
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
    {
      "feature": "Age",
      "impact": 0.42,
      "direction": "positive"
    },
    {
      "feature": "Job",
      "impact": 0.25,
      "direction": "positive"
    }
  ],
  "top_negative_factors": [
    {
      "feature": "Duration",
      "impact": -0.31,
      "direction": "negative"
    },
    {
      "feature": "Credit_amount",
      "impact": -0.15,
      "direction": "negative"
    }
  ],
  "all_feature_impacts": [
    {
      "feature": "Age",
      "impact": 0.42,
      "direction": "positive"
    },
    {
      "feature": "Duration",
      "impact": -0.31,
      "direction": "negative"
    }
  ]
}
```

### Model Information

```http
GET /model/info
```

**Response:**
```json
{
  "loaded": true,
  "pipeline_steps": ["preprocessor", "classifier"],
  "feature_count": 15,
  "classifier_type": "XGBClassifier",
  "version": "1.0.0"
}
```

### Feature Information

```http
GET /features
```

**Response:**
```json
{
  "input_features": ["Age", "Sex", "Job", "Housing", "Saving_accounts", "Checking_account", "Credit_amount", "Duration", "Purpose"],
  "transformed_feature_count": 15,
  "feature_descriptions": {
    "Age": "Applicant's age in years",
    "Sex": "Applicant's sex (male/female)",
    "Job": "Job category (0-3)",
    "Housing": "Housing status (own/rent/free)",
    "Saving_accounts": "Savings account status",
    "Checking_account": "Checking account status",
    "Credit_amount": "Requested credit amount",
    "Duration": "Loan duration in months",
    "Purpose": "Purpose of the loan"
  }
}
```

## Input Fields Reference

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| Age | integer | Yes | Applicant's age (18-120) | 35 |
| Sex | string | Yes | "male" or "female" | "male" |
| Job | integer | Yes | Job category (0-3) | 2 |
| Housing | string | Yes | "own", "rent", or "free" | "own" |
| Saving_accounts | string | No | "little", "moderate", "quite rich", "rich", or null | "moderate" |
| Checking_account | string | No | "little", "moderate", "rich", or null | "little" |
| Credit_amount | float | Yes | Loan amount requested | 5000.0 |
| Duration | integer | Yes | Loan duration in months (1-72) | 24 |
| Purpose | string | Yes | Loan purpose | "car" |

## Docker Usage

### Build the Image

```bash
docker build -t loan-approval-api .
```

### Run the Container

```bash
docker run -p 8000:8000 loan-approval-api
```

### With Custom Model Path

```bash
docker run -p 8000:8000 \
  -v /path/to/your/model:/app/models \
  -e MODEL_PATH=/app/models/your_model.pkl \
  loan-approval-api
```

### Development Mode

```bash
docker build --target development -t loan-approval-api:dev .
docker run -p 8000:8000 -v $(pwd)/app:/app/app loan-approval-api:dev
```

## AWS Lambda Deployment

The application includes Mangum integration for seamless AWS Lambda deployment.

### Lambda Handler

The handler is already configured in `app/main.py`:

```python
from mangum import Mangum
handler = Mangum(app, lifespan="auto")
```

### Deployment Steps

1. **Package the application**:
   ```bash
   pip install -r requirements.txt -t package/
   cp -r app package/
   cp -r models package/
   cd package && zip -r ../deployment.zip .
   ```

2. **Create Lambda function**:
   - Runtime: Python 3.11
   - Handler: `app.main.handler`
   - Memory: 512MB+ (for SHAP computations)
   - Timeout: 30 seconds

3. **Configure API Gateway**:
   - Create HTTP API or REST API
   - Configure routes to Lambda integration
   - Enable CORS if needed

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MODEL_PATH | Path to the model file | `./models/xgb_pipeline.pkl` |

## Testing with curl

### Health Check

```bash
curl http://localhost:8000/
```

### Make a Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Age": 35,
    "Sex": "male",
    "Job": 2,
    "Housing": "own",
    "Saving_accounts": "moderate",
    "Checking_account": "little",
    "Credit_amount": 5000.0,
    "Duration": 24,
    "Purpose": "car"
  }'
```

### Using PowerShell

```powershell
$body = @{
    Age = 35
    Sex = "male"
    Job = 2
    Housing = "own"
    Saving_accounts = "moderate"
    Checking_account = "little"
    Credit_amount = 5000.0
    Duration = 24
    Purpose = "car"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/predict" -Method Post -Body $body -ContentType "application/json"
```

## Understanding SHAP Explanations

### What are SHAP Values?

SHAP (SHapley Additive exPlanations) values explain how each feature contributes to pushing the prediction away from the base rate:

- **Positive SHAP value**: Feature pushes toward loan approval
- **Negative SHAP value**: Feature pushes toward loan rejection
- **Magnitude**: Larger absolute values indicate stronger influence

### Example Interpretation

```json
{
  "feature": "Age",
  "impact": 0.42,
  "direction": "positive"
}
```

This means:
- The applicant's age contributed **+0.42** to the log-odds of approval
- Higher age (in this case) **increases** the likelihood of approval

## Error Handling

The API returns structured error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Successful prediction
- `400`: Invalid input data
- `500`: Internal server error
- `503`: Model not loaded/available

## Performance Considerations

- **Model Loading**: Models are cached at startup to avoid per-request loading
- **SHAP Computation**: TreeExplainer is optimized for tree-based models
- **Memory**: SHAP computations require additional memory; allocate 512MB+ for Lambda

## Security Notes

- Configure CORS appropriately for production
- Never expose sensitive model information in error messages
- Use HTTPS in production
- Implement rate limiting for public APIs
- Consider authentication for production deployments

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
