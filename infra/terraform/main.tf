terraform {
  required_version = ">= 1.7"

  # Bootstrap: on a fresh project, create this bucket by hand before `terraform init`.
  backend "gcs" {
    bucket = "quinchool-tfstate"
    prefix = "terraform"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

locals {
  project_id   = "quinchool"
  region       = "asia-southeast1"
  github_owner = "QuinchTeam"
  github_repo  = "Quinchool"
  web_domain   = "quinchool.quinchy.dev"
  api_domain   = "api.quinchool.quinchy.dev"
}

provider "google" {
  project = local.project_id
  region  = local.region
}

# Auth: GITHUB_TOKEN env var, e.g. `export GITHUB_TOKEN=$(gh auth token)`.
provider "github" {
  owner = local.github_owner
}
