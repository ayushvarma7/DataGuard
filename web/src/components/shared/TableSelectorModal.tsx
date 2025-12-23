import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Database, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    tables: string[];
    selectedTables: string[];
    onSelectionChange: (selected: string[]) => void;
    onConfirm: () => void;
    multiple?: boolean;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    tables,
    selectedTables,
    onSelectionChange,
    onConfirm,
    multiple = false,
}) => {
    const toggleSelection = (table: string) => {
        if (multiple) {
            if (selectedTables.includes(table)) {
                onSelectionChange(selectedTables.filter((t) => t !== table));
            } else {
                onSelectionChange([...selectedTables, table]);
            }
        } else {
            onSelectionChange([table]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[300px] pr-4 py-2">
                    <div className="space-y-2">
                        {tables.map((table) => (
                            <button
                                key={table}
                                onClick={() => toggleSelection(table)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left",
                                    selectedTables.includes(table)
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <TableIcon className={cn(
                                        "h-4 w-4",
                                        selectedTables.includes(table) ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    <span className="font-medium">{table}</span>
                                </div>
                                {selectedTables.includes(table) && (
                                    <Check className="h-4 w-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                        Cancel
                    </Button>
                    <Button
                        disabled={selectedTables.length === 0}
                        onClick={onConfirm}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {multiple ? `Process ${selectedTables.length} Tables` : 'Process Selected'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
