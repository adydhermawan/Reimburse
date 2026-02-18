const { withGradleProperties } = require('expo/config-plugins');

/**
 * Config plugin to set Gradle JVM memory settings
 * Fixes OOM crash during expo-updates KSP compilation
 */
module.exports = function withCustomGradleProperties(config) {
    return withGradleProperties(config, (config) => {
        const props = config.modResults;

        // Set JVM args for Gradle daemon
        setProperty(props, 'org.gradle.jvmargs', '-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError');

        // Enable parallel builds
        setProperty(props, 'org.gradle.parallel', 'true');

        // Use Kotlin daemon for faster compilation
        setProperty(props, 'kotlin.daemon.jvmargs', '-Xmx2g');

        return config;
    });
};

function setProperty(props, key, value) {
    const existing = props.findIndex((p) => p.type === 'property' && p.key === key);
    if (existing >= 0) {
        props[existing].value = value;
    } else {
        props.push({
            type: 'property',
            key,
            value,
        });
    }
}
