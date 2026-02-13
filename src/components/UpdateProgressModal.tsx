import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

interface UpdateProgressModalProps {
    visible: boolean;
    progress: number;
}

const { width } = Dimensions.get('window');

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({ visible, progress }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { }} // Prevent closing via back button during update
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Mengunduh Update</Text>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                    </View>

                    <Text style={styles.percentage}>
                        {Math.round(progress * 100)}%
                    </Text>

                    <Text style={styles.subtitle}>
                        Mohon tunggu, aplikasi sedang mengunduh pembaruan...
                    </Text>

                    <ActivityIndicator size="small" color="#007BFF" style={{ marginTop: 10 }} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        width: width * 0.85,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007BFF',
    },
    percentage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007BFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});
