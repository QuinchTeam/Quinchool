def fixture:
  {apiVersion: "serving.knative.dev/v1", kind: "Service",
   metadata: {name: "quinchool-test", namespace: "123", resourceVersion: "old", annotations: {keep: "yes"}},
   status: {ready: true},
   spec: {traffic: [{latestRevision: true, percent: 100}],
     template: {metadata: {name: "old-revision", annotations: {keep: "yes"}},
       spec: {serviceAccountName: "runtime", containers: [{image: "old-image", ports: [{containerPort: 8080}],
         env: [{name: "SECRET", valueFrom: {secretKeyRef: {name: "secret", key: "latest"}}}],
         resources: {limits: {cpu: "1000m", memory: "512Mi"}}, startupProbe: {tcpSocket: {port: 8080}}}]}}}};
fixture as $original
| ($original | migrate) as $named
| if $named.spec.template.spec.containers[0].name == "app"
     and ($named.spec.template.spec.containers[0] | del(.name)) == $original.spec.template.spec.containers[0]
     and $named.spec.traffic == $original.spec.traffic
     and $named.spec.template.spec.serviceAccountName == "runtime"
     and $named.spec.template.metadata.annotations == $original.spec.template.metadata.annotations
     and $named.metadata.annotations == $original.metadata.annotations
     and ($named | has("status") | not)
     and ($named.metadata | has("resourceVersion") | not)
     and ($named.spec.template.metadata | has("name") | not)
     and (try ($original | .spec.template.spec.containers += [.spec.template.spec.containers[0]] | migrate | false) catch true)
     and (try ($original | .spec.template.spec.containers[0].name = "existing" | migrate | false) catch true)
  then "PASS: name existing container, preserve settings, reject ambiguous migrations"
  else error("Container migration regression") end
