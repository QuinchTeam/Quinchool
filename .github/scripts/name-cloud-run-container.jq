if (.spec.template.spec.containers | length) != 1
   or ((.spec.template.spec.containers[0].ports // []) | length) != 1
   or (.spec.template.spec.containers[0].name // "") != ""
then error("Expected one unnamed ingress container")
else
  {apiVersion, kind, metadata: (.metadata | {name, namespace, labels, annotations}), spec}
  | .spec.template.spec.containers[0].name = "app"
  | del(.spec.template.metadata.name)
end
