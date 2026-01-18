import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

export default function InstanceIndex() {
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>();

  React.useEffect(() => {
    const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;
    if (!instanceId) return;

    router.replace({
      pathname: '/(app)/instance/[instanceId]/overview',
      params: { instanceId },
    });
  }, [params.instanceId]);

  return null;
}
