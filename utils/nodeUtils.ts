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
            // Merge IP addresses if they are different
            const currentIps = (existing.all_ips || [existing.ip || existing.address]).filter(Boolean);
            const newNodeIp = node.ip || node.address;

            if (newNodeIp && !currentIps.includes(newNodeIp)) {
                existing.all_ips = [...currentIps, newNodeIp];
                // Keep the 'ip' field as a comma-separated string for easy display in legacy components
                existing.ip = existing.all_ips.join(', ');
            }

            // Optionally merge other fields if needed, like keeping the most recent 'last_seen'
            if (new Date(node.last_seen || 0) > new Date(existing.last_seen || 0)) {
                existing.last_seen = node.last_seen;
                existing.status = node.status;
            }
        } else {
            // Clone the node and initialize all_ips
            const newNode = { ...node };
            const initialIp = node.ip || node.address;
            if (initialIp) {
                newNode.all_ips = [initialIp];
            } else {
                newNode.all_ips = [];
            }
            grouped.set(node.pubkey, newNode);
        }
    });

    return Array.from(grouped.values());
}
