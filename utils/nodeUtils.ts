import { PNode } from '../types/node.types';

/**
 * Groups nodes by their public key and aggregates multiple IP addresses.
 * This prevents duplicate key errors in React and allows displaying all IPs for a node.
 */
export function groupNodesByPubKey(nodes: PNode[]): PNode[] {
    const grouped = new Map<string, PNode>();

    nodes.forEach(node => {
        const existing = grouped.get(node.pubkey);
        if (existing) {
            // Merge unique addresses
            const currentAddresses = existing.all_ips || [existing.address];
            const newAddress = node.address;

            if (newAddress && !currentAddresses.includes(newAddress)) {
                existing.all_ips = [...currentAddresses, newAddress];
                // Keep 'address' as the primary field for identification
            }

            // Keep the most recent 'last_seen'
            if (new Date(node.last_seen || 0) > new Date(existing.last_seen || 0)) {
                existing.last_seen = node.last_seen;
                existing.status = node.status;
                existing.is_online = node.is_online;
            }
        } else {
            // Clone the node and initialize all_ips
            const newNode = { ...node };
            if (node.address) {
                newNode.all_ips = [node.address];
            } else {
                newNode.all_ips = [];
            }
            grouped.set(node.pubkey, newNode);
        }
    });

    return Array.from(grouped.values());
}
