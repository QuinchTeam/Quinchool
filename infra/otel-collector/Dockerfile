FROM us-docker.pkg.dev/cloud-ops-agents-artifacts/google-cloud-opentelemetry-collector/otelcol-google:0.162.0
COPY infra/otel-collector/config.gcp.yaml /etc/otelcol-google/config.yaml
CMD ["--config=/etc/otelcol-google/config.yaml"]
